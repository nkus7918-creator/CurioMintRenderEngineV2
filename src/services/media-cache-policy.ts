import dns from "dns/promises";
import fs from "fs/promises";
import net from "net";
import path from "path";

export const MEDIA_CACHE_DIR =
  path.resolve(
    "/app/media-cache",
  );

const parsePositiveNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
};

const MB =
  1024 * 1024;

const GB =
  1024 * MB;

const HOUR =
  60 * 60 * 1000;

export const mediaCachePolicy =
  Object.freeze({
    maxFileBytes:
      parsePositiveNumber(
        process.env
          .MEDIA_CACHE_MAX_FILE_MB,
        750,
      ) * MB,

    maxTotalBytes:
      parsePositiveNumber(
        process.env
          .MEDIA_CACHE_MAX_TOTAL_GB,
        12,
      ) * GB,

    ttlMs:
      parsePositiveNumber(
        process.env
          .MEDIA_CACHE_TTL_HOURS,
        168,
      ) * HOUR,

    partialFileTtlMs:
      parsePositiveNumber(
        process.env
          .MEDIA_CACHE_PART_TTL_HOURS,
        1,
      ) * HOUR,
  });

const isPrivateIpv4 = (
  address: string,
): boolean => {
  const parts =
    address
      .split(".")
      .map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255,
    )
  ) {
    return true;
  }

  const [
    first,
    second,
  ] = parts;

  if (
    first === undefined ||
    second === undefined
  ) {
    return true;
  }

  if (
    first === 0 ||
    first === 10 ||
    first === 127
  ) {
    return true;
  }

  if (
    first === 100 &&
    second >= 64 &&
    second <= 127
  ) {
    return true;
  }

  if (
    first === 169 &&
    second === 254
  ) {
    return true;
  }

  if (
    first === 172 &&
    second >= 16 &&
    second <= 31
  ) {
    return true;
  }

  if (
    first === 192 &&
    second === 168
  ) {
    return true;
  }

  if (
    first === 198 &&
    (
      second === 18 ||
      second === 19
    )
  ) {
    return true;
  }

  if (first >= 224) {
    return true;
  }

  return false;
};

const isPrivateIpv6 = (
  address: string,
): boolean => {
  const normalized =
    address.toLowerCase();

  if (
    normalized === "::" ||
    normalized === "::1"
  ) {
    return true;
  }

  if (
    normalized.startsWith(
      "::ffff:",
    )
  ) {
    const ipv4 =
      normalized.slice(
        "::ffff:".length,
      );

    if (
      net.isIP(ipv4) === 4
    ) {
      return isPrivateIpv4(
        ipv4,
      );
    }
  }

  const firstSegment =
    normalized
      .split(":")[0];

  const firstValue =
    Number.parseInt(
      firstSegment || "0",
      16,
    );

  /*
   * fc00::/7
   */
  if (
    (
      firstValue &
      0xfe00
    ) ===
    0xfc00
  ) {
    return true;
  }

  /*
   * fe80::/10
   */
  if (
    (
      firstValue &
      0xffc0
    ) ===
    0xfe80
  ) {
    return true;
  }

  /*
   * ff00::/8 multicast
   */
  if (
    (
      firstValue &
      0xff00
    ) ===
    0xff00
  ) {
    return true;
  }

  return false;
};

export const isPrivateIpAddress = (
  address: string,
): boolean => {
  const type =
    net.isIP(address);

  if (type === 4) {
    return isPrivateIpv4(
      address,
    );
  }

  if (type === 6) {
    return isPrivateIpv6(
      address,
    );
  }

  return true;
};

export const assertSafeRemoteMediaUrl =
  async (
    value: string,
  ): Promise<URL> => {
    let parsed: URL;

    try {
      parsed =
        new URL(value);
    } catch {
      throw new Error(
        "Media URL is invalid.",
      );
    }

    if (
      parsed.protocol !==
        "https:" &&
      parsed.protocol !==
        "http:"
    ) {
      throw new Error(
        `Unsupported media URL protocol: ${parsed.protocol}`,
      );
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      throw new Error(
        "Media URLs with credentials are not allowed.",
      );
    }

    const hostname =
      parsed.hostname
        .replace(
          /^\[|\]$/g,
          "",
        )
        .toLowerCase();

    if (
      hostname ===
        "localhost" ||
      hostname.endsWith(
        ".localhost",
      ) ||
      hostname.endsWith(
        ".local",
      ) ||
      hostname.endsWith(
        ".internal",
      )
    ) {
      throw new Error(
        `Private media hostname is not allowed: ${hostname}`,
      );
    }

    const ipType =
      net.isIP(hostname);

    if (ipType !== 0) {
      if (
        isPrivateIpAddress(
          hostname,
        )
      ) {
        throw new Error(
          `Private media IP address is not allowed: ${hostname}`,
        );
      }

      return parsed;
    }

    let addresses:
      Array<{
        address: string;
        family: number;
      }>;

    try {
      addresses =
        await dns.lookup(
          hostname,
          {
            all: true,
            verbatim: true,
          },
        );
    } catch (error) {
      throw new Error(
        `Unable to resolve media hostname "${hostname}": ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }

    if (
      addresses.length === 0
    ) {
      throw new Error(
        `Media hostname resolved to no addresses: ${hostname}`,
      );
    }

    for (
      const result of addresses
    ) {
      if (
        isPrivateIpAddress(
          result.address,
        )
      ) {
        throw new Error(
          `Media hostname "${hostname}" resolves to a private address.`,
        );
      }
    }

    return parsed;
  };

type CacheFileEntry = {
  name: string;

  filePath: string;

  size: number;

  mtimeMs: number;
};

const readCacheEntries =
  async (): Promise<
    CacheFileEntry[]
  > => {
    await fs.mkdir(
      MEDIA_CACHE_DIR,
      {
        recursive: true,
      },
    );

    const entries =
      await fs.readdir(
        MEDIA_CACHE_DIR,
        {
          withFileTypes: true,
        },
      );

    const result:
      CacheFileEntry[] = [];

    for (
      const entry of entries
    ) {
      if (!entry.isFile()) {
        continue;
      }

      const filePath =
        path.join(
          MEDIA_CACHE_DIR,
          entry.name,
        );

      try {
        const stat =
          await fs.stat(
            filePath,
          );

        result.push({
          name: entry.name,

          filePath,

          size: stat.size,

          mtimeMs:
            stat.mtimeMs,
        });
      } catch {
        // Dosya yarış halinde
        // silinmiş olabilir.
      }
    }

    return result;
  };

export type MediaCacheMaintenanceResult =
  {
    evictedCount: number;

    expiredCount: number;

    partialCount: number;

    totalBytes: number;

    fileCount: number;
  };

export const maintainMediaCache =
  async ({
    protectedFileNames = [],
  }: {
    protectedFileNames?:
      string[];
  } = {}): Promise<MediaCacheMaintenanceResult> => {
    const protectedSet =
      new Set(
        protectedFileNames,
      );

    const now =
      Date.now();

    let entries =
      await readCacheEntries();

    let evictedCount = 0;

    let expiredCount = 0;

    let partialCount = 0;

    /*
     * Yarım kalmış eski download'lar.
     */
    for (
      const entry of entries
    ) {
      if (
        !entry.name.endsWith(
          ".part",
        )
      ) {
        continue;
      }

      const age =
        now -
        entry.mtimeMs;

      if (
        age <
        mediaCachePolicy
          .partialFileTtlMs
      ) {
        continue;
      }

      await fs.rm(
        entry.filePath,
        {
          force: true,
        },
      );

      partialCount++;
    }

    entries =
      await readCacheEntries();

    /*
     * TTL geçmiş normal cache
     * dosyaları.
     */
    for (
      const entry of entries
    ) {
      if (
        entry.name.endsWith(
          ".part",
        ) ||
        protectedSet.has(
          entry.name,
        )
      ) {
        continue;
      }

      const age =
        now -
        entry.mtimeMs;

      if (
        age <
        mediaCachePolicy.ttlMs
      ) {
        continue;
      }

      await fs.rm(
        entry.filePath,
        {
          force: true,
        },
      );

      expiredCount++;
    }

    entries =
      (
        await readCacheEntries()
      ).filter(
        (entry) =>
          !entry.name.endsWith(
            ".part",
          ),
      );

    let totalBytes =
      entries.reduce(
        (
          sum,
          entry,
        ) =>
          sum +
          entry.size,
        0,
      );

    /*
     * Toplam limit aşılırsa
     * en eski kullanılan dosyalardan
     * başlayarak temizle.
     */
    if (
      totalBytes >
      mediaCachePolicy
        .maxTotalBytes
    ) {
      const evictionCandidates =
        entries
          .filter(
            (entry) =>
              !protectedSet.has(
                entry.name,
              ),
          )
          .sort(
            (left, right) =>
              left.mtimeMs -
              right.mtimeMs,
          );

      for (
        const entry of
        evictionCandidates
      ) {
        if (
          totalBytes <=
          mediaCachePolicy
            .maxTotalBytes
        ) {
          break;
        }

        await fs.rm(
          entry.filePath,
          {
            force: true,
          },
        );

        totalBytes -=
          entry.size;

        evictedCount++;
      }
    }

    const finalEntries =
      (
        await readCacheEntries()
      ).filter(
        (entry) =>
          !entry.name.endsWith(
            ".part",
          ),
      );

    return {
      evictedCount,

      expiredCount,

      partialCount,

      totalBytes:
        finalEntries.reduce(
          (
            sum,
            entry,
          ) =>
            sum +
            entry.size,
          0,
        ),

      fileCount:
        finalEntries.length,
    };
  };

export const touchMediaCacheFile =
  async (
    filePath: string,
  ): Promise<void> => {
    const now =
      new Date();

    try {
      await fs.utimes(
        filePath,
        now,
        now,
      );
    } catch {
      // Cache hit ile dosya silinmesi
      // arasındaki yarış kritik değil.
    }
  };
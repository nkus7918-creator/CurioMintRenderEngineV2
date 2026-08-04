import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

import { logger } from "../shared/logger";

const CACHE_RELATIVE_DIR = "cache/media";

const CACHE_ABSOLUTE_DIR = path.resolve(
  "./public",
  CACHE_RELATIVE_DIR,
);

const DOWNLOAD_CONCURRENCY = 3;
const MAX_DOWNLOAD_ATTEMPTS = 3;
const DOWNLOAD_TIMEOUT_MS = 120_000;

type MediaLike = {
  type?: unknown;
  url?: unknown;
  [key: string]: unknown;
};

type SectionLike = {
  media?: unknown;
  [key: string]: unknown;
};

type PropsLike = {
  sections?: unknown;
  chapters?: unknown;
  [key: string]: unknown;
};

export type CacheMediaResult = {
  props: Record<string, unknown>;
  downloadedCount: number;
  cacheHitCount: number;
  failedCount: number;
  bundleRefreshRequired: boolean;
};

const isRemoteHttpUrl = (
  value: unknown,
): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  return (
    value.startsWith("https://") ||
    value.startsWith("http://")
  );
};

const getExtensionFromUrl = (
  url: string,
): string => {
  try {
    const pathname = new URL(url).pathname;
    const extension = path.extname(pathname).toLowerCase();

    if (
      extension === ".mp4" ||
      extension === ".webm" ||
      extension === ".mov"
    ) {
      return extension;
    }
  } catch {
    // Fallback aşağıda.
  }

  return ".mp4";
};

const createCacheFileName = (
  url: string,
): string => {
  const hash = crypto
    .createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);

  return `${hash}${getExtensionFromUrl(url)}`;
};

const getCachePaths = (
  url: string,
) => {
  const fileName = createCacheFileName(url);

  return {
    absolutePath: path.join(
      CACHE_ABSOLUTE_DIR,
      fileName,
    ),

    /*
     * Remotion public/ köküne göre yol.
     * Baştaki slash kullanılmıyor; VideoRenderer
     * içinde staticFile() ile çözülecek.
     */
    relativePath: `${CACHE_RELATIVE_DIR}/${fileName}`,
  };
};

const fileExistsAndIsUsable = async (
  filePath: string,
): Promise<boolean> => {
  try {
    const stat = await fs.stat(filePath);

    return (
      stat.isFile() &&
      stat.size > 10_000
    );
  } catch {
    return false;
  }
};

const sleep = (
  milliseconds: number,
) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const downloadFile = async ({
  url,
  destination,
}: {
  url: string;
  destination: string;
}): Promise<void> => {
  const temporaryPath = `${destination}.part`;

  await fs.rm(temporaryPath, {
    force: true,
  });

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_DOWNLOAD_ATTEMPTS;
    attempt++
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,

        headers: {
          "User-Agent":
            "CurioMint-Render-Engine/2.0",

          Accept:
            "video/mp4,video/webm,video/*,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error(
          "Download response body is empty.",
        );
      }

      const nodeReadable =
        Readable.fromWeb(
          response.body as never,
        );

      const fileHandle =
        await fs.open(
          temporaryPath,
          "w",
        );

      try {
        await pipeline(
          nodeReadable,
          fileHandle.createWriteStream(),
        );
      } finally {
        await fileHandle.close();
      }

      const downloadedStat =
        await fs.stat(temporaryPath);

      if (downloadedStat.size <= 10_000) {
        throw new Error(
          `Downloaded file is unexpectedly small: ${downloadedStat.size} bytes`,
        );
      }

      await fs.rename(
        temporaryPath,
        destination,
      );

      clearTimeout(timeout);
      return;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      await fs.rm(temporaryPath, {
        force: true,
      });

      if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
        await sleep(attempt * 1_500);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Unknown media download error.",
      );
};

const runWithConcurrency = async <T,>(
  items: T[],
  concurrency: number,
  handler: (
    item: T,
    index: number,
  ) => Promise<void>,
): Promise<void> => {
  let nextIndex = 0;

  const workers = Array.from(
    {
      length: Math.min(
        concurrency,
        items.length,
      ),
    },
    async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex++;

        if (currentIndex >= items.length) {
          return;
        }

        await handler(
          items[currentIndex],
          currentIndex,
        );
      }
    },
  );

  await Promise.all(workers);
};

const collectRemoteUrls = (
  props: PropsLike,
): string[] => {
  const urls = new Set<string>();

  const inspectSections = (
    sections: unknown,
  ) => {
    if (!Array.isArray(sections)) {
      return;
    }

    sections.forEach((sectionValue) => {
      if (
        !sectionValue ||
        typeof sectionValue !== "object"
      ) {
        return;
      }

      const section =
        sectionValue as SectionLike;

      if (!Array.isArray(section.media)) {
        return;
      }

      section.media.forEach(
        (mediaValue) => {
          if (
            !mediaValue ||
            typeof mediaValue !==
              "object"
          ) {
            return;
          }

          const media =
            mediaValue as MediaLike;

          if (
            media.type === "video" &&
            isRemoteHttpUrl(media.url)
          ) {
            urls.add(media.url);
          }
        },
      );
    });
  };

  inspectSections(props.sections);

  if (Array.isArray(props.chapters)) {
    props.chapters.forEach(
      (chapterValue) => {
        if (
          chapterValue &&
          typeof chapterValue ===
            "object"
        ) {
          inspectSections(
            (
              chapterValue as {
                sections?: unknown;
              }
            ).sections,
          );
        }
      },
    );
  }

  return [...urls];
};

const replaceMediaUrls = ({
  props,
  urlMap,
}: {
  props: PropsLike;
  urlMap: Map<string, string>;
}): Record<string, unknown> => {
  const clone = structuredClone(
    props,
  ) as PropsLike;

  const replaceInSections = (
    sections: unknown,
  ) => {
    if (!Array.isArray(sections)) {
      return;
    }

    sections.forEach((sectionValue) => {
      if (
        !sectionValue ||
        typeof sectionValue !== "object"
      ) {
        return;
      }

      const section =
        sectionValue as SectionLike;

      if (!Array.isArray(section.media)) {
        return;
      }

      section.media.forEach(
        (mediaValue) => {
          if (
            !mediaValue ||
            typeof mediaValue !==
              "object"
          ) {
            return;
          }

          const media =
            mediaValue as MediaLike;

          if (
            isRemoteHttpUrl(media.url)
          ) {
            const replacement =
              urlMap.get(media.url);

            if (replacement) {
              media.url = replacement;
              media.cached = true;
            }
          }
        },
      );
    });
  };

  replaceInSections(clone.sections);

  if (Array.isArray(clone.chapters)) {
    clone.chapters.forEach(
      (chapterValue) => {
        if (
          chapterValue &&
          typeof chapterValue ===
            "object"
        ) {
          replaceInSections(
            (
              chapterValue as {
                sections?: unknown;
              }
            ).sections,
          );
        }
      },
    );
  }

  return clone as Record<
    string,
    unknown
  >;
};

export const cacheRemoteMedia =
  async (
    props: Record<string, unknown>,
    jobId: string,
  ): Promise<CacheMediaResult> => {
    const cacheLogger = logger.child({
      jobId,
      component: "media-cache",
    });

    await fs.mkdir(
      CACHE_ABSOLUTE_DIR,
      {
        recursive: true,
      },
    );

    const urls = collectRemoteUrls(
      props as PropsLike,
    );

    if (urls.length === 0) {
      return {
        props,
        downloadedCount: 0,
        cacheHitCount: 0,
        failedCount: 0,
        bundleRefreshRequired: false,
      };
    }

    const urlMap =
      new Map<string, string>();

    let downloadedCount = 0;
    let cacheHitCount = 0;
    let failedCount = 0;

    cacheLogger.info(
      {
        event: "media-cache.started",
        mediaCount: urls.length,
        concurrency:
          DOWNLOAD_CONCURRENCY,
      },
      "Media caching started",
    );

    await runWithConcurrency(
      urls,
      DOWNLOAD_CONCURRENCY,
      async (url, index) => {
        const {
          absolutePath,
          relativePath,
        } = getCachePaths(url);

        const alreadyCached =
          await fileExistsAndIsUsable(
            absolutePath,
          );

        if (alreadyCached) {
          cacheHitCount++;
          urlMap.set(
            url,
            relativePath,
          );

          cacheLogger.info(
            {
              event:
                "media-cache.hit",
              index: index + 1,
              total: urls.length,
              relativePath,
            },
            "Media cache hit",
          );

          return;
        }

        try {
          await downloadFile({
            url,
            destination:
              absolutePath,
          });

          downloadedCount++;

          urlMap.set(
            url,
            relativePath,
          );

          cacheLogger.info(
            {
              event:
                "media-cache.downloaded",
              index: index + 1,
              total: urls.length,
              relativePath,
            },
            "Media downloaded to cache",
          );
        } catch (error) {
          failedCount++;

          /*
           * Cache başarısız olursa uzak URL
           * korunur. Tüm job'u hemen çöpe
           * atmıyoruz.
           */
          cacheLogger.warn(
            {
              event:
                "media-cache.download.failed",
              index: index + 1,
              total: urls.length,
              url,
              err: error,
            },
            "Media download failed; remote URL will be used",
          );
        }
      },
    );

    cacheLogger.info(
      {
        event: "media-cache.completed",
        mediaCount: urls.length,
        downloadedCount,
        cacheHitCount,
        failedCount,
      },
      "Media caching completed",
    );

    return {
      props: replaceMediaUrls({
        props: props as PropsLike,
        urlMap,
      }),

      downloadedCount,
      cacheHitCount,
      failedCount,

      /*
       * public/ klasörüne yeni dosya eklendiyse
       * bundle'ın bu dosyaları görmesi için yeniden
       * oluşturulması gerekiyor.
       */
      bundleRefreshRequired:
        downloadedCount > 0,
    };
  };
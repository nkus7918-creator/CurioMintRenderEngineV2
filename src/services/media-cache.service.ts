import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  Readable,
  Transform,
} from "stream";
import type {
  TransformCallback,
} from "stream";
import {
  pipeline,
} from "stream/promises";

import {
  env,
} from "../config/env";

import {
  logger,
} from "../shared/logger";

import {
  assertSafeRemoteMediaUrl,
  maintainMediaCache,
  MEDIA_CACHE_DIR,
  mediaCachePolicy,
  touchMediaCacheFile,
} from "./media-cache-policy";

const CACHE_ABSOLUTE_DIR =
  MEDIA_CACHE_DIR;

const CACHE_PUBLIC_BASE_URL =
  `http://127.0.0.1:${env.port}/media-cache`;

const DOWNLOAD_CONCURRENCY = 3;

const MAX_DOWNLOAD_ATTEMPTS = 3;

const DOWNLOAD_TIMEOUT_MS =
  120_000;

const MAX_REDIRECTS = 5;

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

  evictedCount: number;

  expiredCount: number;

  cacheBytes: number;

  cacheFileCount: number;
};

class DownloadByteLimitTransform extends Transform {
  private totalBytes = 0;

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.totalBytes +=
      chunk.length;

    if (
      this.totalBytes >
      mediaCachePolicy.maxFileBytes
    ) {
      callback(
        new Error(
          `Media file exceeded maximum cache file size of ${Math.round(
            mediaCachePolicy.maxFileBytes /
              1024 /
              1024,
          )} MB.`,
        ),
      );

      return;
    }

    callback(
      null,
      chunk,
    );
  }
}

const isRemoteHttpUrl = (
  value: unknown,
): value is string => {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  return (
    value.startsWith(
      "https://",
    ) ||
    value.startsWith(
      "http://",
    )
  );
};

const getExtensionFromUrl = (
  url: string,
): string => {
  try {
    const pathname =
      new URL(url).pathname;

    const extension =
      path
        .extname(pathname)
        .toLowerCase();

    if (
      extension === ".mp4" ||
      extension === ".webm" ||
      extension === ".mov" ||
      extension === ".jpg" ||
      extension === ".jpeg" ||
      extension === ".png" ||
      extension === ".webp"
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
  const hash =
    crypto
      .createHash("sha256")
      .update(url)
      .digest("hex")
      .slice(0, 32);

  return (
    `${hash}${getExtensionFromUrl(
      url,
    )}`
  );
};

const getCachePaths = (
  url: string,
) => {
  const fileName =
    createCacheFileName(
      url,
    );

  return {
    fileName,

    absolutePath:
      path.join(
        CACHE_ABSOLUTE_DIR,
        fileName,
      ),

    localUrl:
      `${CACHE_PUBLIC_BASE_URL}/${fileName}`,
  };
};

const fileExistsAndIsUsable =
  async (
    filePath: string,
  ): Promise<boolean> => {
    try {
      const stat =
        await fs.stat(
          filePath,
        );

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
): Promise<void> =>
  new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );

const fetchMediaWithSafeRedirects =
  async (
    initialUrl: string,
    signal: AbortSignal,
  ): Promise<Response> => {
    let currentUrl =
      initialUrl;

    for (
      let redirectCount = 0;
      redirectCount <=
      MAX_REDIRECTS;
      redirectCount++
    ) {
      await assertSafeRemoteMediaUrl(
        currentUrl,
      );

      const response =
        await fetch(
          currentUrl,
          {
            signal,

            redirect:
              "manual",

            headers: {
              "User-Agent":
                "CurioMint-Render-Engine/2.0",

              Accept:
                "video/mp4,video/webm,video/*,image/jpeg,image/png,image/webp,image/*,*/*",
            },
          },
        );

      const isRedirect =
        response.status === 301 ||
        response.status === 302 ||
        response.status === 303 ||
        response.status === 307 ||
        response.status === 308;

      if (!isRedirect) {
        return response;
      }

      const location =
        response.headers.get(
          "location",
        );

      if (response.body) {
        await response.body
          .cancel()
          .catch(
            () => undefined,
          );
      }

      if (!location) {
        throw new Error(
          "Media redirect response did not include a Location header.",
        );
      }

      if (
        redirectCount >=
        MAX_REDIRECTS
      ) {
        throw new Error(
          `Media download exceeded ${MAX_REDIRECTS} redirects.`,
        );
      }

      currentUrl =
        new URL(
          location,
          currentUrl,
        ).toString();
    }

    throw new Error(
      "Unable to resolve media redirect.",
    );
  };

const downloadFile = async ({
  url,
  destination,
}: {
  url: string;

  destination: string;
}): Promise<void> => {
  const temporaryPath =
    `${destination}.part`;

  await fs.rm(
    temporaryPath,
    {
      force: true,
    },
  );

  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <=
    MAX_DOWNLOAD_ATTEMPTS;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        DOWNLOAD_TIMEOUT_MS,
      );

    try {
      const response =
        await fetchMediaWithSafeRedirects(
          url,
          controller.signal,
        );

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

      const contentLengthHeader =
        response.headers.get(
          "content-length",
        );

      if (
        contentLengthHeader
      ) {
        const contentLength =
          Number(
            contentLengthHeader,
          );

        if (
          Number.isFinite(
            contentLength,
          ) &&
          contentLength >
            mediaCachePolicy
              .maxFileBytes
        ) {
          throw new Error(
            `Media file is too large: ${Math.round(
              contentLength /
                1024 /
                1024,
            )} MB. Maximum allowed size is ${Math.round(
              mediaCachePolicy
                .maxFileBytes /
                1024 /
                1024,
            )} MB.`,
          );
        }
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

          new DownloadByteLimitTransform(),

          fileHandle
            .createWriteStream(),
        );
      } finally {
        await fileHandle.close();
      }

      const downloadedStat =
        await fs.stat(
          temporaryPath,
        );

      if (
        downloadedStat.size <=
        10_000
      ) {
        throw new Error(
          `Downloaded file is unexpectedly small: ${downloadedStat.size} bytes`,
        );
      }

      if (
        downloadedStat.size >
        mediaCachePolicy
          .maxFileBytes
      ) {
        throw new Error(
          "Downloaded media exceeded the maximum allowed cache file size.",
        );
      }

      await fs.rename(
        temporaryPath,
        destination,
      );

      clearTimeout(
        timeout,
      );

      return;
    } catch (error) {
      clearTimeout(
        timeout,
      );

      lastError =
        error;

      await fs.rm(
        temporaryPath,
        {
          force: true,
        },
      );

      if (
        attempt <
        MAX_DOWNLOAD_ATTEMPTS
      ) {
        await sleep(
          attempt *
            1_500,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Unknown media download error.",
      );
};

const runWithConcurrency =
  async <T>(
    items: T[],
    concurrency: number,
    handler: (
      item: T,
      index: number,
    ) => Promise<void>,
  ): Promise<void> => {
    let nextIndex = 0;

    const workers =
      Array.from(
        {
          length:
            Math.min(
              concurrency,
              items.length,
            ),
        },

        async () => {
          while (true) {
            const currentIndex =
              nextIndex;

            nextIndex++;

            if (
              currentIndex >=
              items.length
            ) {
              return;
            }

            const item =
              items[
                currentIndex
              ];

            if (
              item === undefined
            ) {
              continue;
            }

            await handler(
              item,
              currentIndex,
            );
          }
        },
      );

    await Promise.all(
      workers,
    );
  };

const collectRemoteUrls = (
  props: PropsLike,
): string[] => {
  const urls =
    new Set<string>();

  const inspectSections = (
    sections: unknown,
  ) => {
    if (
      !Array.isArray(
        sections,
      )
    ) {
      return;
    }

    sections.forEach(
      (
        sectionValue,
      ) => {
        if (
          !sectionValue ||
          typeof sectionValue !==
            "object"
        ) {
          return;
        }

        const section =
          sectionValue as SectionLike;

        if (
          !Array.isArray(
            section.media,
          )
        ) {
          return;
        }

        section.media.forEach(
          (
            mediaValue,
          ) => {
            if (
              !mediaValue ||
              typeof mediaValue !==
                "object"
            ) {
              return;
            }

            const media =
              mediaValue as MediaLike;

            const isSupportedMedia =
              media.type ===
                "video" ||
              media.type ===
                "image";

            const isExistingLocalCacheUrl =
              typeof media.url ===
                "string" &&
              (
                media.url.startsWith(
                  CACHE_PUBLIC_BASE_URL,
                ) ||
                media.url.startsWith(
                  `http://localhost:${env.port}/media-cache`,
                )
              );

            if (
              isSupportedMedia &&
              isRemoteHttpUrl(
                media.url,
              ) &&
              !isExistingLocalCacheUrl
            ) {
              urls.add(
                media.url,
              );
            }
          },
        );
      },
    );
  };

  inspectSections(
    props.sections,
  );

  if (
    Array.isArray(
      props.chapters,
    )
  ) {
    props.chapters.forEach(
      (
        chapterValue,
      ) => {
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

  return [
    ...urls,
  ];
};

const replaceMediaUrls = ({
  props,
  urlMap,
}: {
  props: PropsLike;

  urlMap:
    Map<string, string>;
}): Record<string, unknown> => {
  const clone =
    structuredClone(
      props,
    ) as PropsLike;

  const replaceInSections = (
    sections: unknown,
  ) => {
    if (
      !Array.isArray(
        sections,
      )
    ) {
      return;
    }

    sections.forEach(
      (
        sectionValue,
      ) => {
        if (
          !sectionValue ||
          typeof sectionValue !==
            "object"
        ) {
          return;
        }

        const section =
          sectionValue as SectionLike;

        if (
          !Array.isArray(
            section.media,
          )
        ) {
          return;
        }

        section.media.forEach(
          (
            mediaValue,
          ) => {
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
              isRemoteHttpUrl(
                media.url,
              )
            ) {
              const replacement =
                urlMap.get(
                  media.url,
                );

              if (
                replacement
              ) {
                media.url =
                  replacement;

                media.cached =
                  true;
              }
            }
          },
        );
      },
    );
  };

  replaceInSections(
    clone.sections,
  );

  if (
    Array.isArray(
      clone.chapters,
    )
  ) {
    clone.chapters.forEach(
      (
        chapterValue,
      ) => {
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
    props: Record<
      string,
      unknown
    >,

    jobId: string,
  ): Promise<CacheMediaResult> => {
    const cacheLogger =
      logger.child({
        jobId,

        component:
          "media-cache",
      });

    await fs.mkdir(
      CACHE_ABSOLUTE_DIR,
      {
        recursive: true,
      },
    );

    const initialMaintenance =
      await maintainMediaCache();

    const urls =
      collectRemoteUrls(
        props as PropsLike,
      );

    if (
      urls.length === 0
    ) {
      return {
        props,

        downloadedCount: 0,

        cacheHitCount: 0,

        failedCount: 0,

        bundleRefreshRequired:
          false,

        evictedCount:
          initialMaintenance
            .evictedCount,

        expiredCount:
          initialMaintenance
            .expiredCount,

        cacheBytes:
          initialMaintenance
            .totalBytes,

        cacheFileCount:
          initialMaintenance
            .fileCount,
      };
    }

    const urlMap =
      new Map<
        string,
        string
      >();

    let downloadedCount = 0;

    let cacheHitCount = 0;

    let failedCount = 0;

    const failedUrls: string[] = [];

    cacheLogger.info(
      {
        event:
          "media-cache.started",

        mediaCount:
          urls.length,

        concurrency:
          DOWNLOAD_CONCURRENCY,

        maxFileMb:
          Math.round(
            mediaCachePolicy
              .maxFileBytes /
              1024 /
              1024,
          ),

        maxTotalGb:
          Number(
            (
              mediaCachePolicy
                .maxTotalBytes /
              1024 /
              1024 /
              1024
            ).toFixed(2),
          ),
      },

      "Media caching started",
    );

    await runWithConcurrency(
      urls,

      DOWNLOAD_CONCURRENCY,

      async (
        url,
        index,
      ) => {
        const {
          absolutePath,
          localUrl,
        } =
          getCachePaths(
            url,
          );

        const alreadyCached =
          await fileExistsAndIsUsable(
            absolutePath,
          );

        if (
          alreadyCached
        ) {
          await touchMediaCacheFile(
            absolutePath,
          );

          cacheHitCount++;

          urlMap.set(
            url,
            localUrl,
          );

          cacheLogger.info(
            {
              event:
                "media-cache.hit",

              index:
                index + 1,

              total:
                urls.length,

              localUrl,
            },

            "Media cache hit",
          );

          return;
        }

        try {
          await assertSafeRemoteMediaUrl(
            url,
          );

          await downloadFile({
            url,

            destination:
              absolutePath,
          });

          downloadedCount++;

          urlMap.set(
            url,
            localUrl,
          );

          cacheLogger.info(
            {
              event:
                "media-cache.downloaded",

              index:
                index + 1,

              total:
                urls.length,

              localUrl,
            },

            "Media downloaded to cache",
          );
        } catch (error) {
          failedCount++;

          failedUrls.push(
            url,
          );

          /*
           * Render uzaktaki kaynağa doğrudan
           * düşmemeli. Chromium tarafındaki
           * ağ hataları siyah kare üretebildiği
           * için aşağıda job kontrollü biçimde
           * durdurulur.
           */
          cacheLogger.warn(
            {
              event:
                "media-cache.download.failed",

              index:
                index + 1,

              total:
                urls.length,

              url,

              err: error,
            },

            "Media download failed; remote URL will be used",
          );
        }
      },
    );

    if (
      failedUrls.length > 0
    ) {
      throw new Error(
        `Media cache could not download ${failedUrls.length} required asset(s). First failed URL: ${failedUrls[0]}`,
      );
    }

    const protectedFileNames =
      urls.map(
        (url) =>
          path.basename(
            getCachePaths(
              url,
            ).absolutePath,
          ),
      );

    const finalMaintenance =
      await maintainMediaCache({
        protectedFileNames,
      });

    const evictedCount =
      initialMaintenance
        .evictedCount +
      finalMaintenance
        .evictedCount;

    const expiredCount =
      initialMaintenance
        .expiredCount +
      finalMaintenance
        .expiredCount;

    cacheLogger.info(
      {
        event:
          "media-cache.completed",

        mediaCount:
          urls.length,

        downloadedCount,

        cacheHitCount,

        failedCount,

        evictedCount,

        expiredCount,

        cacheBytes:
          finalMaintenance
            .totalBytes,

        cacheFileCount:
          finalMaintenance
            .fileCount,
      },

      "Media caching completed",
    );

    return {
      props:
        replaceMediaUrls({
          props:
            props as PropsLike,

          urlMap,
        }),

      downloadedCount,

      cacheHitCount,

      failedCount,

      /*
       * Cache /app/media-cache altında ve
       * Express tarafından servis edildiği
       * için Remotion bundle'ını yeniden
       * oluşturmaya gerek yok.
       */
      bundleRefreshRequired:
        false,

      evictedCount,

      expiredCount,

      cacheBytes:
        finalMaintenance
          .totalBytes,

      cacheFileCount:
        finalMaintenance
          .fileCount,
    };
  };

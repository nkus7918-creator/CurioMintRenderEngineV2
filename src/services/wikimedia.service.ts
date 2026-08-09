import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  Readable,
} from "stream";
import {
  pipeline,
} from "stream/promises";

import {
  env,
} from "../config/env";

const COMMONS_API =
  "https://commons.wikimedia.org/w/api.php";

const WIKIMEDIA_CACHE_DIR =
  path.resolve(
    "/app/media-cache",
    "wikimedia",
  );

const FILES_DIR =
  path.join(
    WIKIMEDIA_CACHE_DIR,
    "files",
  );

const METADATA_DIR =
  path.join(
    WIKIMEDIA_CACHE_DIR,
    "metadata",
  );

const RESOLUTIONS_DIR =
  path.join(
    WIKIMEDIA_CACHE_DIR,
    "resolutions",
  );

const PUBLIC_BASE_URL =
  `http://127.0.0.1:${env.port}/media-cache/wikimedia`;

const SEARCH_LIMIT_DEFAULT = 8;
const SEARCH_LIMIT_MAX = 10;
const THUMB_WIDTH = 1600;

const REQUEST_TIMEOUT_MS =
  30_000;

const DOWNLOAD_TIMEOUT_MS =
  90_000;

const MAX_DOWNLOAD_BYTES =
  20 * 1024 * 1024;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (Wikimedia Commons visual resolver)";

export type WikimediaVisualKind =
  | "person"
  | "artifact"
  | "building"
  | "place"
  | "event"
  | "general";

export type WikimediaOrientation =
  | "landscape"
  | "portrait"
  | "square"
  | "any";

type WikimediaExtMetadataValue = {
  value?: unknown;
};

type WikimediaExtMetadata =
  Record<
    string,
    WikimediaExtMetadataValue
  >;

type WikimediaImageInfo = {
  url?: string;
  descriptionurl?: string;

  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  thumbmime?: string;

  width?: number;
  height?: number;
  size?: number;
  mime?: string;

  extmetadata?:
    WikimediaExtMetadata;
};

type WikimediaApiPage = {
  pageid?: number;
  ns?: number;
  title?: string;

  imageinfo?:
    WikimediaImageInfo[];
};

type WikimediaApiResponse = {
  query?: {
    pages?: WikimediaApiPage[];
  };

  error?: {
    code?: string;
    info?: string;
  };
};

type LicenseClass =
  | "public-domain"
  | "cc0"
  | "cc-by";

export type WikimediaAttribution = {
  title: string;
  artist: string | null;

  licenseClass:
    LicenseClass;

  licenseShortName: string;
  licenseUrl: string | null;

  attributionRequired:
    boolean;

  creditLine: string;

  sourcePageUrl: string;

  originalFileUrl: string;

  modifications:
    string;
};

export type WikimediaCandidate = {
  pageId: number | null;
  fileTitle: string;

  accepted: boolean;
  rejectionReasons: string[];

  score: number;

  width: number;
  height: number;

  thumbnailWidth: number;
  thumbnailHeight: number;

  mime: string | null;

  downloadUrl: string | null;
  originalFileUrl: string | null;
  sourcePageUrl: string | null;

  description: string | null;
  assessments: string[];

  attribution:
    | WikimediaAttribution
    | null;
};

export type WikimediaResolvedVisual = {
  query: string;

  kind:
    WikimediaVisualKind;

  preferredOrientation:
    WikimediaOrientation;

  cacheHit: boolean;

  fileTitle: string;
  pageId: number | null;

  localUrl: string;
  localPath: string;

  width: number;
  height: number;

  sourceWidth: number;
  sourceHeight: number;

  mime: string;

  attribution:
    WikimediaAttribution;

  metadataPath: string;
};

type ResolutionCacheRecord = {
  query: string;

  kind:
    WikimediaVisualKind;

  preferredOrientation:
    WikimediaOrientation;

  selectedAt:
    string;

  fileName: string;
  metadataFileName: string;

  fileTitle: string;
  pageId: number | null;

  width: number;
  height: number;

  sourceWidth: number;
  sourceHeight: number;

  mime: string;

  attribution:
    WikimediaAttribution;
};

const ensureCacheDirs =
  async () => {
    await Promise.all([
      fs.mkdir(
        FILES_DIR,
        {
          recursive: true,
        },
      ),

      fs.mkdir(
        METADATA_DIR,
        {
          recursive: true,
        },
      ),

      fs.mkdir(
        RESOLUTIONS_DIR,
        {
          recursive: true,
        },
      ),
    ]);
  };

const normalizeText = (
  value: unknown,
): string =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

const truncate = (
  value: string,
  maxLength: number,
): string =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1).trim()}â€¦`;

const decodeHtmlEntities = (
  value: string,
): string =>
  value
    .replace(
      /&nbsp;/gi,
      " ",
    )
    .replace(
      /&amp;/gi,
      "&",
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#39;|&apos;/gi,
      "'",
    )
    .replace(
      /&lt;/gi,
      "<",
    )
    .replace(
      /&gt;/gi,
      ">",
    )
    .replace(
      /&#(\d+);/g,
      (_match, code) => {
        const number =
          Number(code);

        return Number.isFinite(number)
          ? String.fromCodePoint(
              number,
            )
          : "";
      },
    );

const stripHtml = (
  value: unknown,
): string => {
  const input =
    String(value ?? "");

  if (!input) {
    return "";
  }

  return decodeHtmlEntities(
    input
      .replace(
        /<br\s*\/?>/gi,
        " ",
      )
      .replace(
        /<\/p>/gi,
        " ",
      )
      .replace(
        /<[^>]+>/g,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim(),
  )
    .replace(/\s+/g, " ")
    .trim();
};

const getMetadataValue = (
  metadata:
    | WikimediaExtMetadata
    | undefined,
  key: string,
): string => {
  const raw =
    metadata?.[key]
      ?.value;

  return stripHtml(raw);
};

const parseBoolean = (
  value: string,
): boolean => {
  const normalized =
    value
      .trim()
      .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes"
  );
};

const classifyLicense = ({
  licenseShortName,
  usageTerms,
}: {
  licenseShortName: string;
  usageTerms: string;
}):
  | {
      accepted: true;
      licenseClass:
        LicenseClass;
    }
  | {
      accepted: false;
      reason: string;
    } => {
  const combined =
    `${licenseShortName} ${usageTerms}`
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (
    combined.includes(
      "public domain",
    ) ||
    /^pd(?:\b|-)/i.test(
      licenseShortName,
    )
  ) {
    return {
      accepted: true,
      licenseClass:
        "public-domain",
    };
  }

  if (
    combined.includes("cc0") ||
    combined.includes(
      "creative commons zero",
    )
  ) {
    return {
      accepted: true,
      licenseClass: "cc0",
    };
  }

  if (
    combined.includes(
      "cc by-sa",
    ) ||
    combined.includes(
      "cc-by-sa",
    ) ||
    combined.includes(
      "sharealike",
    )
  ) {
    return {
      accepted: false,
      reason:
        "ShareAlike license is excluded by CurioMint policy.",
    };
  }

  if (
    combined.includes(
      "noncommercial",
    ) ||
    combined.includes(
      "cc by-nc",
    ) ||
    combined.includes(
      "cc-by-nc",
    )
  ) {
    return {
      accepted: false,
      reason:
        "NonCommercial license is not allowed.",
    };
  }

  if (
    combined.includes(
      "no derivatives",
    ) ||
    combined.includes(
      "noderivatives",
    ) ||
    combined.includes(
      "cc by-nd",
    ) ||
    combined.includes(
      "cc-by-nd",
    )
  ) {
    return {
      accepted: false,
      reason:
        "NoDerivatives license is not allowed.",
    };
  }

  const compact =
    licenseShortName
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (
    compact.startsWith(
      "cc by ",
    ) ||
    compact === "cc by" ||
    combined.includes(
      "creative commons attribution",
    )
  ) {
    return {
      accepted: true,
      licenseClass:
        "cc-by",
    };
  }

  return {
    accepted: false,
    reason:
      `Unsupported license: ${licenseShortName || "unknown"}`,
  };
};

const orientationOf = (
  width: number,
  height: number,
):
  | "landscape"
  | "portrait"
  | "square" => {
  const ratio =
    width /
    Math.max(
      1,
      height,
    );

  if (ratio >= 1.15) {
    return "landscape";
  }

  if (ratio <= 0.87) {
    return "portrait";
  }

  return "square";
};

const scoreCandidate = ({
  fileTitle,
  description,
  assessments,
  width,
  height,
  licenseClass,
  preferredOrientation,
  query,
  searchIndex,
}: {
  fileTitle: string;
  description: string;
  assessments: string[];
  width: number;
  height: number;
  licenseClass:
    LicenseClass;
  preferredOrientation:
    WikimediaOrientation;
  query: string;
  searchIndex: number;
}): number => {
  let score =
    200 -
    searchIndex * 8;

  const normalizedQuery =
    normalizeText(query);

  const queryTokens =
    normalizedQuery
      .split(" ")
      .filter(
        (token) =>
          token.length >= 3,
      );

  const normalizedHaystack =
    normalizeText(
      `${fileTitle} ${description}`,
    );

  for (const token of queryTokens) {
    if (
      normalizedHaystack.includes(
        token,
      )
    ) {
      score += 18;
    }
  }

  if (
    normalizeText(
      fileTitle,
    ).includes(
      normalizedQuery,
    )
  ) {
    score += 45;
  }

  const actualOrientation =
    orientationOf(
      width,
      height,
    );

  if (
    preferredOrientation ===
      "any" ||
    preferredOrientation ===
      actualOrientation
  ) {
    score += 25;
  } else if (
    preferredOrientation ===
      "landscape" &&
    actualOrientation ===
      "square"
  ) {
    score += 8;
  }

  const megaPixels =
    (width * height) /
    1_000_000;

  score +=
    Math.min(
      35,
      Math.log2(
        Math.max(
          1,
          megaPixels,
        ) + 1,
      ) * 12,
    );

  const assessmentText =
    assessments
      .join(" ")
      .toLowerCase();

  if (
    assessmentText.includes(
      "featured",
    )
  ) {
    score += 35;
  }

  if (
    assessmentText.includes(
      "quality",
    )
  ) {
    score += 25;
  }

  if (
    assessmentText.includes(
      "valued",
    )
  ) {
    score += 15;
  }

  if (
    licenseClass ===
    "public-domain"
  ) {
    score += 12;
  } else if (
    licenseClass ===
    "cc0"
  ) {
    score += 10;
  } else {
    score += 6;
  }

  return Number(
    score.toFixed(2),
  );
};

const createAttribution = ({
  page,
  info,
  licenseClass,
}: {
  page:
    WikimediaApiPage;

  info:
    WikimediaImageInfo;

  licenseClass:
    LicenseClass;
}):
  | WikimediaAttribution
  | null => {
  const metadata =
    info.extmetadata;

  const fileTitle =
    String(
      page.title ??
        "Wikimedia Commons file",
    );

  const objectName =
    getMetadataValue(
      metadata,
      "ObjectName",
    );

  const title =
    objectName ||
    fileTitle.replace(
      /^File:/i,
      "",
    );

  const artistRaw =
    getMetadataValue(
      metadata,
      "Artist",
    );

  const artist =
    artistRaw
      ? truncate(
          artistRaw,
          500,
        )
      : null;

  const licenseShortName =
    getMetadataValue(
      metadata,
      "LicenseShortName",
    );

  const licenseUrl =
    getMetadataValue(
      metadata,
      "LicenseUrl",
    ) || null;

  const attributionRequired =
    parseBoolean(
      getMetadataValue(
        metadata,
        "AttributionRequired",
      ),
    );

  const sourcePageUrl =
    String(
      info.descriptionurl ??
        "",
    );

  const originalFileUrl =
    String(
      info.url ??
        "",
    );

  if (
    !licenseShortName ||
    !sourcePageUrl ||
    !originalFileUrl
  ) {
    return null;
  }

  if (
    licenseClass ===
      "cc-by" &&
    !licenseUrl
  ) {
    return null;
  }

  const creator =
    artist ??
    "Unknown creator";

  return {
    title:
      truncate(
        title,
        500,
      ),

    artist,

    licenseClass,

    licenseShortName:
      truncate(
        licenseShortName,
        120,
      ),

    licenseUrl,

    attributionRequired,

    creditLine:
      `${creator} / Wikimedia Commons / ${licenseShortName}`,

    sourcePageUrl,

    originalFileUrl,

    modifications:
      "CurioMint may crop, scale, animate, or composite the cached image for documentary presentation.",
  };
};

const evaluatePage = ({
  page,
  query,
  preferredOrientation,
  searchIndex,
}: {
  page:
    WikimediaApiPage;

  query: string;

  preferredOrientation:
    WikimediaOrientation;

  searchIndex: number;
}): WikimediaCandidate => {
  const info =
    page.imageinfo?.[0];

  const fileTitle =
    String(
      page.title ??
        "",
    );

  const rejectionReasons:
    string[] = [];

  if (!info) {
    rejectionReasons.push(
      "No imageinfo metadata.",
    );
  }

  const metadata =
    info?.extmetadata;

  const licenseShortName =
    getMetadataValue(
      metadata,
      "LicenseShortName",
    );

  const usageTerms =
    getMetadataValue(
      metadata,
      "UsageTerms",
    );

  const restrictions =
    getMetadataValue(
      metadata,
      "Restrictions",
    );

  const licenseResult =
    classifyLicense({
      licenseShortName,
      usageTerms,
    });

  if (!licenseResult.accepted) {
    rejectionReasons.push(
      licenseResult.reason,
    );
  }

  if (restrictions) {
    rejectionReasons.push(
      `Non-copyright restrictions present: ${truncate(restrictions, 180)}`,
    );
  }

  const sourceWidth =
    Number(
      info?.width ??
        0,
    );

  const sourceHeight =
    Number(
      info?.height ??
        0,
    );

  if (
    !Number.isFinite(
      sourceWidth,
    ) ||
    !Number.isFinite(
      sourceHeight,
    ) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    rejectionReasons.push(
      "Missing image dimensions.",
    );
  }

  if (
    Math.max(
      sourceWidth,
      sourceHeight,
    ) < 700 ||
    sourceWidth *
      sourceHeight <
      350_000
  ) {
    rejectionReasons.push(
      `Resolution too low: ${sourceWidth}x${sourceHeight}`,
    );
  }

  const downloadUrl =
    String(
      info?.thumburl ??
        info?.url ??
        "",
    ) || null;

  const effectiveMime =
    String(
      info?.thumbmime ??
        info?.mime ??
        "",
    ).toLowerCase();

  const allowedMime =
    effectiveMime ===
      "image/jpeg" ||
    effectiveMime ===
      "image/png" ||
    effectiveMime ===
      "image/webp";

  if (!allowedMime) {
    rejectionReasons.push(
      `Unsupported render MIME: ${effectiveMime || "unknown"}`,
    );
  }

  if (!downloadUrl) {
    rejectionReasons.push(
      "No downloadable image URL.",
    );
  }

  const sourcePageUrl =
    String(
      info?.descriptionurl ??
        "",
    ) || null;

  const originalFileUrl =
    String(
      info?.url ??
        "",
    ) || null;

  const description =
    getMetadataValue(
      metadata,
      "ImageDescription",
    ) || null;

  const assessments =
    getMetadataValue(
      metadata,
      "Assessments",
    )
      .split("|")
      .map(
        (value) =>
          value.trim(),
      )
      .filter(Boolean);

  let attribution:
    | WikimediaAttribution
    | null = null;

  if (licenseResult.accepted) {
    attribution =
      createAttribution({
        page,
        info:
          info ?? {},
        licenseClass:
          licenseResult.licenseClass,
      });

    if (!attribution) {
      rejectionReasons.push(
        "Required attribution metadata is incomplete.",
      );
    }
  }

  const accepted =
    rejectionReasons.length ===
    0 &&
    Boolean(attribution);

  const score =
    accepted &&
    licenseResult.accepted
      ? scoreCandidate({
          fileTitle,
          description:
            description ?? "",
          assessments,
          width:
            sourceWidth,
          height:
            sourceHeight,
          licenseClass:
            licenseResult.licenseClass,
          preferredOrientation,
          query,
          searchIndex,
        })
      : 0;

  return {
    pageId:
      Number.isInteger(
        page.pageid,
      )
        ? Number(
            page.pageid,
          )
        : null,

    fileTitle,

    accepted,

    rejectionReasons,

    score,

    width:
      sourceWidth,

    height:
      sourceHeight,

    thumbnailWidth:
      Number(
        info?.thumbwidth ??
          sourceWidth,
      ),

    thumbnailHeight:
      Number(
        info?.thumbheight ??
          sourceHeight,
      ),

    mime:
      effectiveMime ||
      null,

    downloadUrl,

    originalFileUrl,

    sourcePageUrl,

    description,

    assessments,

    attribution,
  };
};

const fetchJson = async (
  url: string,
): Promise<WikimediaApiResponse> => {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          headers: {
            "User-Agent":
              USER_AGENT,

            Accept:
              "application/json",
          },
        },
      );

    if (!response.ok) {
      throw new Error(
        `Wikimedia API HTTP ${response.status} ${response.statusText}`,
      );
    }

    return await response.json() as WikimediaApiResponse;
  } finally {
    clearTimeout(
      timeout,
    );
  }
};

export const searchWikimediaVisuals =
  async ({
    query,
    preferredOrientation =
      "landscape",
    limit =
      SEARCH_LIMIT_DEFAULT,
  }: {
    query: string;

    preferredOrientation?:
      WikimediaOrientation;

    limit?: number;
  }): Promise<WikimediaCandidate[]> => {
    const cleanQuery =
      String(
        query ?? "",
      ).trim();

    if (!cleanQuery) {
      throw new Error(
        "Wikimedia query is required.",
      );
    }

    const safeLimit =
      Math.max(
        1,
        Math.min(
          SEARCH_LIMIT_MAX,
          Math.round(
            Number(limit) ||
            SEARCH_LIMIT_DEFAULT,
          ),
        ),
      );

    const params =
      new URLSearchParams({
        action: "query",
        format: "json",
        formatversion: "2",

        generator:
          "search",

        gsrsearch:
          cleanQuery,

        gsrnamespace:
          "6",

        gsrlimit:
          String(
            safeLimit,
          ),

        prop:
          "imageinfo",

        iiprop:
          "url|mime|size|thumbmime|extmetadata",

        iiurlwidth:
          String(
            THUMB_WIDTH,
          ),

        iiextmetadatalanguage:
          "en",

        iiextmetadatafilter:
          [
            "Artist",
            "Credit",
            "LicenseShortName",
            "LicenseUrl",
            "UsageTerms",
            "AttributionRequired",
            "Copyrighted",
            "Restrictions",
            "ImageDescription",
            "ObjectName",
            "Assessments",
          ].join("|"),
      });

    const response =
      await fetchJson(
        `${COMMONS_API}?${params.toString()}`,
      );

    if (response.error) {
      throw new Error(
        `Wikimedia API ${response.error.code ?? "error"}: ${response.error.info ?? "unknown error"}`,
      );
    }

    const pages =
      response.query?.pages ??
      [];

    return pages
      .map(
        (
          page,
          searchIndex,
        ) =>
          evaluatePage({
            page,
            query:
              cleanQuery,
            preferredOrientation,
            searchIndex,
          }),
      )
      .sort(
        (a, b) => {
          if (
            a.accepted !==
            b.accepted
          ) {
            return a.accepted
              ? -1
              : 1;
          }

          return (
            b.score -
            a.score
          );
        },
      );
  };

const extensionForMime = (
  mime: string,
): string => {
  switch (
    mime.toLowerCase()
  ) {
    case "image/jpeg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    default:
      throw new Error(
        `Unsupported Wikimedia cache MIME: ${mime}`,
      );
  }
};

const fileExistsAndUsable =
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
        stat.size >
          10_000
      );
    } catch {
      return false;
    }
  };

const downloadImage = async ({
  url,
  destination,
  expectedMime,
}: {
  url: string;
  destination: string;
  expectedMime: string;
}) => {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      DOWNLOAD_TIMEOUT_MS,
    );

  const temporaryPath =
    `${destination}.part`;

  await fs.rm(
    temporaryPath,
    {
      force: true,
    },
  );

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          headers: {
            "User-Agent":
              USER_AGENT,

            Accept:
              "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
          },
        },
      );

    if (!response.ok) {
      throw new Error(
        `Wikimedia image HTTP ${response.status} ${response.statusText}`,
      );
    }

    const responseMime =
      String(
        response.headers
          .get(
            "content-type",
          ) ??
          "",
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    if (
      responseMime &&
      responseMime !==
        expectedMime
    ) {
      const acceptablePair =
        (
          responseMime ===
            "image/jpg" &&
          expectedMime ===
            "image/jpeg"
        ) ||
        (
          responseMime ===
            "image/jpeg" &&
          expectedMime ===
            "image/jpg"
        );

      if (!acceptablePair) {
        throw new Error(
          `Unexpected Wikimedia image MIME: ${responseMime}; expected ${expectedMime}`,
        );
      }
    }

    const declaredLength =
      Number(
        response.headers.get(
          "content-length",
        ) ?? 0,
      );

    if (
      Number.isFinite(
        declaredLength,
      ) &&
      declaredLength >
        MAX_DOWNLOAD_BYTES
    ) {
      throw new Error(
        `Wikimedia image exceeds ${MAX_DOWNLOAD_BYTES} byte cache limit.`,
      );
    }

    if (!response.body) {
      throw new Error(
        "Wikimedia image response has no body.",
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

    const stat =
      await fs.stat(
        temporaryPath,
      );

    if (
      stat.size <=
      10_000
    ) {
      throw new Error(
        `Downloaded Wikimedia image is unexpectedly small: ${stat.size} bytes`,
      );
    }

    if (
      stat.size >
      MAX_DOWNLOAD_BYTES
    ) {
      throw new Error(
        `Downloaded Wikimedia image exceeds ${MAX_DOWNLOAD_BYTES} bytes.`,
      );
    }

    await fs.rename(
      temporaryPath,
      destination,
    );
  } catch (error) {
    await fs.rm(
      temporaryPath,
      {
        force: true,
      },
    );

    throw error;
  } finally {
    clearTimeout(
      timeout,
    );
  }
};

const createResolutionKey = ({
  query,
  kind,
  preferredOrientation,
}: {
  query: string;
  kind:
    WikimediaVisualKind;
  preferredOrientation:
    WikimediaOrientation;
}): string =>
  crypto
    .createHash(
      "sha256",
    )
    .update(
      JSON.stringify({
        query:
          normalizeText(
            query,
          ),
        kind,
        preferredOrientation,
        policyVersion:
          1,
      }),
    )
    .digest("hex")
    .slice(0, 32);

const resolutionPathForKey =
  (
    key: string,
  ) =>
    path.join(
      RESOLUTIONS_DIR,
      `${key}.json`,
    );

const localUrlForFile =
  (
    fileName: string,
  ) =>
    `${PUBLIC_BASE_URL}/files/${fileName}`;

const localPathForFile =
  (
    fileName: string,
  ) =>
    path.join(
      FILES_DIR,
      fileName,
    );

const resolvedFromCacheRecord =
  ({
    record,
    cacheHit,
  }: {
    record:
      ResolutionCacheRecord;

    cacheHit: boolean;
  }): WikimediaResolvedVisual => ({
    query:
      record.query,

    kind:
      record.kind,

    preferredOrientation:
      record.preferredOrientation,

    cacheHit,

    fileTitle:
      record.fileTitle,

    pageId:
      record.pageId,

    localUrl:
      localUrlForFile(
        record.fileName,
      ),

    localPath:
      localPathForFile(
        record.fileName,
      ),

    width:
      record.width,

    height:
      record.height,

    sourceWidth:
      record.sourceWidth,

    sourceHeight:
      record.sourceHeight,

    mime:
      record.mime,

    attribution:
      record.attribution,

    metadataPath:
      path.join(
        METADATA_DIR,
        record.metadataFileName,
      ),
  });

const readResolutionCache =
  async (
    resolutionKey: string,
  ):
    Promise<
      WikimediaResolvedVisual
      | null
    > => {
    const manifestPath =
      resolutionPathForKey(
        resolutionKey,
      );

    try {
      const record =
        JSON.parse(
          await fs.readFile(
            manifestPath,
            "utf8",
          ),
        ) as ResolutionCacheRecord;

      const localPath =
        localPathForFile(
          record.fileName,
        );

      const usable =
        await fileExistsAndUsable(
          localPath,
        );

      if (!usable) {
        return null;
      }

      return resolvedFromCacheRecord({
        record,
        cacheHit: true,
      });
    } catch {
      return null;
    }
  };

export const resolveWikimediaVisual =
  async ({
    query,
    kind =
      "general",
    preferredOrientation =
      "landscape",
  }: {
    query: string;

    kind?:
      WikimediaVisualKind;

    preferredOrientation?:
      WikimediaOrientation;
  }): Promise<WikimediaResolvedVisual> => {
    const cleanQuery =
      String(
        query ?? "",
      ).trim();

    if (!cleanQuery) {
      throw new Error(
        "Wikimedia query is required.",
      );
    }

    await ensureCacheDirs();

    const resolutionKey =
      createResolutionKey({
        query:
          cleanQuery,
        kind,
        preferredOrientation,
      });

    const cached =
      await readResolutionCache(
        resolutionKey,
      );

    if (cached) {
      return cached;
    }

    const candidates =
      await searchWikimediaVisuals({
        query:
          cleanQuery,
        preferredOrientation,
        limit:
          SEARCH_LIMIT_DEFAULT,
      });

    const selected =
      candidates.find(
        (candidate) =>
          candidate.accepted &&
          candidate.attribution &&
          candidate.downloadUrl &&
          candidate.mime,
      );

    if (
      !selected ||
      !selected.attribution ||
      !selected.downloadUrl ||
      !selected.mime
    ) {
      const reasons =
        candidates
          .slice(0, 5)
          .map(
            (candidate) =>
              `${candidate.fileTitle || "unknown"}: ${candidate.rejectionReasons.join("; ") || "not selected"}`,
          )
          .join(" | ");

      throw new Error(
        `No Wikimedia candidate passed CurioMint licensing/quality policy for "${cleanQuery}". ${reasons}`,
      );
    }

    const extension =
      extensionForMime(
        selected.mime,
      );

    const fileHash =
      crypto
        .createHash(
          "sha256",
        )
        .update(
          selected.downloadUrl,
        )
        .digest("hex")
        .slice(0, 32);

    const fileName =
      `${fileHash}${extension}`;

    const metadataFileName =
      `${fileHash}.json`;

    const absolutePath =
      localPathForFile(
        fileName,
      );

    const alreadyDownloaded =
      await fileExistsAndUsable(
        absolutePath,
      );

    if (!alreadyDownloaded) {
      await downloadImage({
        url:
          selected.downloadUrl,

        destination:
          absolutePath,

        expectedMime:
          selected.mime,
      });
    }

    const metadataRecord = {
      query:
        cleanQuery,

      kind,

      preferredOrientation,

      selectedAt:
        new Date()
          .toISOString(),

      selectedCandidate: {
        pageId:
          selected.pageId,

        fileTitle:
          selected.fileTitle,

        score:
          selected.score,

        description:
          selected.description,

        assessments:
          selected.assessments,

        sourceWidth:
          selected.width,

        sourceHeight:
          selected.height,

        cachedWidth:
          selected.thumbnailWidth,

        cachedHeight:
          selected.thumbnailHeight,

        mime:
          selected.mime,
      },

      attribution:
        selected.attribution,

      policy: {
        version: 1,

        acceptedLicenseClasses: [
          "public-domain",
          "cc0",
          "cc-by",
        ],

        excludedByDefault: [
          "cc-by-sa",
          "gfdl",
          "noncommercial",
          "no-derivatives",
          "files-with-non-copyright-restrictions",
        ],
      },
    };

    await fs.writeFile(
      path.join(
        METADATA_DIR,
        metadataFileName,
      ),
      JSON.stringify(
        metadataRecord,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    const resolutionRecord:
      ResolutionCacheRecord = {
        query:
          cleanQuery,

        kind,

        preferredOrientation,

        selectedAt:
          new Date()
            .toISOString(),

        fileName,

        metadataFileName,

        fileTitle:
          selected.fileTitle,

        pageId:
          selected.pageId,

        width:
          selected.thumbnailWidth,

        height:
          selected.thumbnailHeight,

        sourceWidth:
          selected.width,

        sourceHeight:
          selected.height,

        mime:
          selected.mime,

        attribution:
          selected.attribution,
      };

    await fs.writeFile(
      resolutionPathForKey(
        resolutionKey,
      ),
      JSON.stringify(
        resolutionRecord,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    return resolvedFromCacheRecord({
      record:
        resolutionRecord,
      cacheHit:
        alreadyDownloaded,
    });
  };

export const getWikimediaResolverStatus =
  async () => {
    await ensureCacheDirs();

    const [
      files,
      metadata,
      resolutions,
    ] =
      await Promise.all([
        fs.readdir(
          FILES_DIR,
        ),

        fs.readdir(
          METADATA_DIR,
        ),

        fs.readdir(
          RESOLUTIONS_DIR,
        ),
      ]);

    return {
      available: true,

      source:
        "Wikimedia Commons",

      api:
        COMMONS_API,

      cacheDirectory:
        WIKIMEDIA_CACHE_DIR,

      cachedFileCount:
        files.length,

      metadataCount:
        metadata.length,

      resolutionCount:
        resolutions.length,

      searchLimit:
        SEARCH_LIMIT_DEFAULT,

      thumbnailWidth:
        THUMB_WIDTH,

      policy: {
        acceptedLicenseClasses: [
          "public-domain",
          "cc0",
          "cc-by",
        ],

        excludedByDefault: [
          "cc-by-sa",
          "gfdl",
          "noncommercial",
          "no-derivatives",
          "files-with-non-copyright-restrictions",
        ],
      },

      renderRuntimeExternalCalls:
        0,
    };
  };
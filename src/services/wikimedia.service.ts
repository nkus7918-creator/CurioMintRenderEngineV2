import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { env } from "../config/env";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const WIKIMEDIA_CACHE_DIR = path.resolve("/app/media-cache", "wikimedia");
const FILES_DIR = path.join(WIKIMEDIA_CACHE_DIR, "files");
const METADATA_DIR = path.join(WIKIMEDIA_CACHE_DIR, "metadata");
const RESOLUTIONS_DIR = path.join(WIKIMEDIA_CACHE_DIR, "resolutions");

const PUBLIC_BASE_URL = `http://127.0.0.1:${env.port}/media-cache/wikimedia`;

const SEARCH_LIMIT_DEFAULT = 10;
const SEARCH_LIMIT_MAX = 10;
const THUMB_WIDTH = 1600;

const REQUEST_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 90_000;
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const MIN_DOWNLOAD_BYTES = 10_000;

const POLICY_VERSION = 3;
const MAX_SEARCH_VARIANTS = 3;
const MIN_ACCEPTED_CANDIDATES_BEFORE_STOP = 3;

const USER_AGENT =
  "CurioMintRenderEngine/2.0 (Wikimedia Commons visual resolver)";

const SUPPORTED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const VISUAL_DESCRIPTOR_TOKENS = new Set([
  "image",
  "images",
  "photo",
  "photos",
  "photograph",
  "photographs",
  "picture",
  "pictures",
  "illustration",
  "illustrations",
  "painting",
  "paintings",
  "artwork",
  "art",
  "diagram",
  "diagrams",
  "timeline",
  "timelines",
  "portrait",
  "portraits",
  "statue",
  "statues",
  "memorial",
  "memorials",
]);

const CONTEXT_TOKENS = new Set([
  "historical",
  "historic",
  "medieval",
  "ancient",
  "modern",
  "europe",
  "european",
  "asia",
  "asian",
  "africa",
  "african",
  "america",
  "american",
]);

const STOP_TOKENS = new Set([
  "the",
  "and",
  "for",
  "from",
  "with",
  "into",
  "onto",
  "over",
  "under",
  "about",
  "around",
  "through",
  "during",
  "before",
  "after",
  "this",
  "that",
  "these",
  "those",
  "of",
  "in",
  "on",
  "at",
  "to",
  "by",
  "a",
  "an",
]);

const DOCUMENT_QUERY_TOKENS = new Set([
  "book",
  "manuscript",
  "document",
  "newspaper",
  "page",
  "scan",
  "archive",
  "report",
  "paper",
  "journal",
]);

const HARD_MAP_QUERY_TOKENS = new Set([
  "map",
  "maps",
  "cartography",
  "cartographic",
  "atlas",
]);

const MAP_SIGNAL_TOKENS = new Set([
  "map",
  "maps",
  "cartography",
  "cartographic",
  "atlas",
  "route",
  "routes",
  "distribution",
  "spread",
  "territory",
  "territories",
  "boundary",
  "boundaries",
]);

const TIMELINE_SIGNAL_TOKENS = new Set([
  "timeline",
  "chronology",
  "chart",
  "graph",
]);

export type WikimediaVisualKind =
  | "person"
  | "artifact"
  | "building"
  | "place"
  | "event"
  | "general";

export type WikimediaOrientation = "landscape" | "portrait" | "square" | "any";

type WikimediaExtMetadataValue = {
  value?: unknown;
};

type WikimediaExtMetadata = Record<string, WikimediaExtMetadataValue>;

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
  extmetadata?: WikimediaExtMetadata;
};

type WikimediaApiPage = {
  pageid?: number;
  ns?: number;
  title?: string;
  imageinfo?: WikimediaImageInfo[];
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

type LicenseClass = "public-domain" | "cc0" | "cc-by";

export type WikimediaAttribution = {
  title: string;
  artist: string | null;
  licenseClass: LicenseClass;
  licenseShortName: string;
  licenseUrl: string | null;
  attributionRequired: boolean;
  creditLine: string;
  sourcePageUrl: string;
  originalFileUrl: string;
  modifications: string;
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
  attribution: WikimediaAttribution | null;
};

export type WikimediaResolvedVisual = {
  query: string;
  kind: WikimediaVisualKind;
  preferredOrientation: WikimediaOrientation;
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
  attribution: WikimediaAttribution;
  metadataPath: string;
};

type ResolutionCacheRecord = {
  query: string;
  kind: WikimediaVisualKind;
  preferredOrientation: WikimediaOrientation;
  selectedAt: string;
  policyVersion: number;
  fileName: string;
  metadataFileName: string;
  fileTitle: string;
  pageId: number | null;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  mime: string;
  attribution: WikimediaAttribution;
};

type RelevanceEvaluation = {
  passed: boolean;
  queryTokens: string[];
  strongTokens: string[];
  contextTokens: string[];
  matchedTokens: string[];
  matchedStrongTokens: string[];
  matchedContextTokens: string[];
  exactCorePhraseMatched: boolean;
};

type DownloadResult = {
  fileName: string;
  mime: string;
  alreadyDownloaded: boolean;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const ensureCacheDirs = async () => {
  await Promise.all([
    fs.mkdir(FILES_DIR, { recursive: true }),
    fs.mkdir(METADATA_DIR, { recursive: true }),
    fs.mkdir(RESOLUTIONS_DIR, { recursive: true }),
  ]);
};

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, maxLength: number): string =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1).trim()}…`;

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => {
      const number = Number(code);
      return Number.isFinite(number) ? String.fromCodePoint(number) : "";
    });

const stripHtml = (value: unknown): string => {
  const input = String(value ?? "");
  if (!input) {
    return "";
  }

  return decodeHtmlEntities(
    input
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .replace(/\s+/g, " ")
    .trim();
};

const getMetadataValue = (
  metadata: WikimediaExtMetadata | undefined,
  key: string,
): string => stripHtml(metadata?.[key]?.value);

const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const normalizeMime = (value: unknown): string => {
  const mime = String(value ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  return mime === "image/jpg" ? "image/jpeg" : mime;
};

const isSupportedImageMime = (mime: string): boolean =>
  SUPPORTED_IMAGE_MIMES.has(normalizeMime(mime));

const extensionForMime = (mime: string): string => {
  switch (normalizeMime(mime)) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      throw new Error(`Unsupported Wikimedia cache MIME: ${mime}`);
  }
};

const stemToken = (token: string): string => {
  if (token.length <= 4) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 5) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
};

const tokenize = (value: unknown): string[] =>
  normalizeText(value)
    .split(" ")
    .map(stemToken)
    .filter((token) => token.length >= 3 && !STOP_TOKENS.has(token));

const classifyLicense = ({
  licenseShortName,
  usageTerms,
}: {
  licenseShortName: string;
  usageTerms: string;
}):
  | { accepted: true; licenseClass: LicenseClass }
  | { accepted: false; reason: string } => {
  const combined = `${licenseShortName} ${usageTerms}`
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (combined.includes("cc0") || combined.includes("creative commons zero")) {
    return { accepted: true, licenseClass: "cc0" };
  }

  if (
    combined.includes("public domain") ||
    /^pd(?:\b|-)/i.test(licenseShortName)
  ) {
    return { accepted: true, licenseClass: "public-domain" };
  }

  if (
    combined.includes("cc by-sa") ||
    combined.includes("cc-by-sa") ||
    combined.includes("sharealike")
  ) {
    return {
      accepted: false,
      reason: "ShareAlike license is excluded by CurioMint policy.",
    };
  }

  if (
    combined.includes("noncommercial") ||
    combined.includes("cc by-nc") ||
    combined.includes("cc-by-nc")
  ) {
    return { accepted: false, reason: "NonCommercial license is not allowed." };
  }

  if (
    combined.includes("no derivatives") ||
    combined.includes("noderivatives") ||
    combined.includes("cc by-nd") ||
    combined.includes("cc-by-nd")
  ) {
    return { accepted: false, reason: "NoDerivatives license is not allowed." };
  }

  const compact = licenseShortName
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    compact.startsWith("cc by ") ||
    compact === "cc by" ||
    combined.includes("creative commons attribution")
  ) {
    return { accepted: true, licenseClass: "cc-by" };
  }

  return {
    accepted: false,
    reason: `Unsupported license: ${licenseShortName || "unknown"}`,
  };
};

const orientationOf = (
  width: number,
  height: number,
): "landscape" | "portrait" | "square" => {
  const ratio = width / Math.max(1, height);
  if (ratio >= 1.15) {
    return "landscape";
  }
  if (ratio <= 0.87) {
    return "portrait";
  }
  return "square";
};

const queryAllowsDocument = (query: string): boolean =>
  tokenize(query).some((token) => DOCUMENT_QUERY_TOKENS.has(token));

const queryRequestsMap = (query: string): boolean =>
  tokenize(query).some((token) => HARD_MAP_QUERY_TOKENS.has(token));

const queryRequestsTimeline = (query: string): boolean =>
  tokenize(query).some((token) => TIMELINE_SIGNAL_TOKENS.has(token));

const isDocumentContainerTitle = (fileTitle: string): boolean =>
  /\.(pdf|djvu)(?:$|\s|\?)/i.test(fileTitle.trim());

const evaluateQueryRelevance = ({
  query,
  fileTitle,
  description,
}: {
  query: string;
  fileTitle: string;
  description: string;
}): RelevanceEvaluation => {
  const queryTokens = [...new Set(tokenize(query))];
  const haystackTokens = [...new Set(tokenize(`${fileTitle} ${description}`))];
  const haystackSet = new Set(haystackTokens);

  const strongTokens = queryTokens.filter(
    (token) =>
      !VISUAL_DESCRIPTOR_TOKENS.has(token) &&
      !CONTEXT_TOKENS.has(token) &&
      !MAP_SIGNAL_TOKENS.has(token) &&
      !TIMELINE_SIGNAL_TOKENS.has(token),
  );

  const contextTokens = queryTokens.filter(
    (token) =>
      CONTEXT_TOKENS.has(token) ||
      MAP_SIGNAL_TOKENS.has(token) ||
      TIMELINE_SIGNAL_TOKENS.has(token),
  );

  const matchedTokens = queryTokens.filter((token) => haystackSet.has(token));
  const matchedStrongTokens = strongTokens.filter((token) =>
    haystackSet.has(token),
  );
  const matchedContextTokens = contextTokens.filter((token) =>
    haystackSet.has(token),
  );

  const normalizedHaystack = normalizeText(`${fileTitle} ${description}`);
  const corePhrase = strongTokens.slice(0, 2).join(" ");
  const exactCorePhraseMatched =
    corePhrase.length > 0 && normalizedHaystack.includes(corePhrase);

  let passed = false;

  if (strongTokens.length >= 2) {
    passed = matchedStrongTokens.length >= 2 || exactCorePhraseMatched;
  } else if (strongTokens.length === 1) {
    passed =
      matchedStrongTokens.length === 1 &&
      (matchedContextTokens.length >= 1 || matchedTokens.length >= 2);
  } else {
    const meaningfulTokens = queryTokens.filter(
      (token) => !VISUAL_DESCRIPTOR_TOKENS.has(token),
    );
    const matchedMeaningful = meaningfulTokens.filter((token) =>
      haystackSet.has(token),
    );
    passed = matchedMeaningful.length >= Math.min(2, meaningfulTokens.length);
  }

  return {
    passed,
    queryTokens,
    strongTokens,
    contextTokens,
    matchedTokens,
    matchedStrongTokens,
    matchedContextTokens,
    exactCorePhraseMatched,
  };
};

const createAttribution = ({
  page,
  info,
  licenseClass,
}: {
  page: WikimediaApiPage;
  info: WikimediaImageInfo;
  licenseClass: LicenseClass;
}): WikimediaAttribution | null => {
  const metadata = info.extmetadata;
  const fileTitle = String(page.title ?? "Wikimedia Commons file");
  const objectName = getMetadataValue(metadata, "ObjectName");
  const title = objectName || fileTitle.replace(/^File:/i, "");
  const artistRaw = getMetadataValue(metadata, "Artist");
  const artist = artistRaw ? truncate(artistRaw, 500) : null;
  const licenseShortName = getMetadataValue(metadata, "LicenseShortName");
  const licenseUrl = getMetadataValue(metadata, "LicenseUrl") || null;
  const attributionRequired = parseBoolean(
    getMetadataValue(metadata, "AttributionRequired"),
  );
  const sourcePageUrl = String(info.descriptionurl ?? "");
  const originalFileUrl = String(info.url ?? "");

  if (!licenseShortName || !sourcePageUrl || !originalFileUrl) {
    return null;
  }

  if (licenseClass === "cc-by" && !licenseUrl) {
    return null;
  }

  const creator = artist ?? "Unknown creator";

  return {
    title: truncate(title, 500),
    artist,
    licenseClass,
    licenseShortName: truncate(licenseShortName, 120),
    licenseUrl,
    attributionRequired,
    creditLine: `${creator} / Wikimedia Commons / ${licenseShortName}`,
    sourcePageUrl,
    originalFileUrl,
    modifications:
      "CurioMint may crop, scale, animate, or composite the cached image for documentary presentation.",
  };
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
  kind,
  searchIndex,
}: {
  fileTitle: string;
  description: string;
  assessments: string[];
  width: number;
  height: number;
  licenseClass: LicenseClass;
  preferredOrientation: WikimediaOrientation;
  query: string;
  kind: WikimediaVisualKind;
  searchIndex: number;
}): number => {
  const relevance = evaluateQueryRelevance({ query, fileTitle, description });
  const titleTokens = new Set(tokenize(fileTitle));
  const normalizedTitle = normalizeText(fileTitle);
  const normalizedQuery = normalizeText(query);

  let score = 0;

  score += relevance.matchedStrongTokens.length * 70;
  score += relevance.matchedContextTokens.length * 18;
  score += relevance.matchedTokens.length * 8;

  if (relevance.exactCorePhraseMatched) {
    score += 80;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    score += 90;
  }

  for (const token of relevance.strongTokens) {
    if (titleTokens.has(token)) {
      score += 35;
    }
  }

  const actualOrientation = orientationOf(width, height);
  if (
    preferredOrientation === "any" ||
    preferredOrientation === actualOrientation
  ) {
    score += 35;
  } else if (
    preferredOrientation === "landscape" &&
    actualOrientation === "square"
  ) {
    score += 12;
  }

  const megaPixels = (width * height) / 1_000_000;
  score += Math.min(25, Math.log2(Math.max(1, megaPixels) + 1) * 9);

  const assessmentText = assessments.join(" ").toLowerCase();
  if (assessmentText.includes("featured")) {
    score += 30;
  }
  if (assessmentText.includes("quality")) {
    score += 20;
  }
  if (assessmentText.includes("valued")) {
    score += 12;
  }

  if (licenseClass === "public-domain") {
    score += 10;
  } else if (licenseClass === "cc0") {
    score += 8;
  } else {
    score += 5;
  }

  const haystack = normalizeText(`${fileTitle} ${description}`);
  if (kind === "person" && /portrait|person|photograph|photo/.test(haystack)) {
    score += 20;
  }
  if (
    kind === "artifact" &&
    /artifact|object|device|machine|mechanism/.test(haystack)
  ) {
    score += 20;
  }
  if (
    kind === "building" &&
    /building|church|cathedral|palace|temple|tower|monument/.test(haystack)
  ) {
    score += 20;
  }
  if (
    kind === "place" &&
    /city|town|village|site|landscape|location|map/.test(haystack)
  ) {
    score += 20;
  }
  if (
    kind === "event" &&
    /battle|war|event|disaster|ceremony|protest|outbreak|plague/.test(haystack)
  ) {
    score += 20;
  }

  score -= searchIndex * 7;

  return Number(score.toFixed(2));
};

const evaluatePage = ({
  page,
  query,
  kind,
  preferredOrientation,
  searchIndex,
}: {
  page: WikimediaApiPage;
  query: string;
  kind: WikimediaVisualKind;
  preferredOrientation: WikimediaOrientation;
  searchIndex: number;
}): WikimediaCandidate => {
  const info = page.imageinfo?.[0];
  const fileTitle = String(page.title ?? "");
  const rejectionReasons: string[] = [];

  if (!info) {
    rejectionReasons.push("No imageinfo metadata.");
  }

  const metadata = info?.extmetadata;
  const licenseShortName = getMetadataValue(metadata, "LicenseShortName");
  const usageTerms = getMetadataValue(metadata, "UsageTerms");
  const restrictions = getMetadataValue(metadata, "Restrictions");
  const licenseResult = classifyLicense({ licenseShortName, usageTerms });

  if (!licenseResult.accepted) {
    rejectionReasons.push(licenseResult.reason);
  }

  if (restrictions) {
    rejectionReasons.push(
      `Non-copyright restrictions present: ${truncate(restrictions, 180)}`,
    );
  }

  const sourceWidth = Number(info?.width ?? 0);
  const sourceHeight = Number(info?.height ?? 0);

  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    rejectionReasons.push("Missing image dimensions.");
  }

  if (
    Math.max(sourceWidth, sourceHeight) < 700 ||
    sourceWidth * sourceHeight < 350_000
  ) {
    rejectionReasons.push(`Resolution too low: ${sourceWidth}x${sourceHeight}`);
  }

  if (sourceWidth > 0 && sourceHeight > 0) {
    const ratio = sourceWidth / sourceHeight;

    if (ratio > 3.6 || ratio < 0.42) {
      rejectionReasons.push(`Extreme aspect ratio: ${ratio.toFixed(2)}.`);
    }

    if (preferredOrientation === "landscape" && ratio < 0.62) {
      rejectionReasons.push(
        `Candidate is too portrait-oriented for landscape use: ${ratio.toFixed(2)}.`,
      );
    }

    if (preferredOrientation === "portrait" && ratio > 1.6) {
      rejectionReasons.push(
        `Candidate is too landscape-oriented for portrait use: ${ratio.toFixed(2)}.`,
      );
    }
  }

  if (isDocumentContainerTitle(fileTitle) && !queryAllowsDocument(query)) {
    rejectionReasons.push(
      "Document container is not suitable for this visual query.",
    );
  }

  const downloadUrl = String(info?.thumburl ?? info?.url ?? "") || null;
  const effectiveMime = normalizeMime(info?.thumbmime ?? info?.mime ?? "");

  if (!isSupportedImageMime(effectiveMime)) {
    rejectionReasons.push(
      `Unsupported render MIME: ${effectiveMime || "unknown"}`,
    );
  }

  if (!downloadUrl) {
    rejectionReasons.push("No downloadable image URL.");
  }

  const sourcePageUrl = String(info?.descriptionurl ?? "") || null;
  const originalFileUrl = String(info?.url ?? "") || null;
  const description = getMetadataValue(metadata, "ImageDescription") || null;

  const relevance = evaluateQueryRelevance({
    query,
    fileTitle,
    description: description ?? "",
  });

  if (!relevance.passed) {
    rejectionReasons.push(
      `Insufficient query relevance. matchedStrong=${relevance.matchedStrongTokens.join(",") || "none"} matched=${relevance.matchedTokens.join(",") || "none"}`,
    );
  }

  const normalizedCandidateText = normalizeText(
    `${fileTitle} ${description ?? ""}`,
  );

  if (queryRequestsMap(query)) {
    const hasMapSignal = [...MAP_SIGNAL_TOKENS].some((token) =>
      normalizedCandidateText.includes(stemToken(token)),
    );

    if (!hasMapSignal) {
      rejectionReasons.push(
        "Map query did not resolve to a map-like candidate.",
      );
    }
  }

  if (queryRequestsTimeline(query)) {
    const hasTimelineSignal = [...TIMELINE_SIGNAL_TOKENS].some((token) =>
      normalizedCandidateText.includes(stemToken(token)),
    );

    if (!hasTimelineSignal) {
      rejectionReasons.push(
        "Timeline query did not resolve to a timeline/chart-like candidate.",
      );
    }
  }

  const assessments = getMetadataValue(metadata, "Assessments")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  let attribution: WikimediaAttribution | null = null;

  if (licenseResult.accepted) {
    attribution = createAttribution({
      page,
      info: info ?? {},
      licenseClass: licenseResult.licenseClass,
    });

    if (!attribution) {
      rejectionReasons.push("Required attribution metadata is incomplete.");
    }
  }

  const accepted = rejectionReasons.length === 0 && Boolean(attribution);

  const score =
    accepted && licenseResult.accepted
      ? scoreCandidate({
          fileTitle,
          description: description ?? "",
          assessments,
          width: sourceWidth,
          height: sourceHeight,
          licenseClass: licenseResult.licenseClass,
          preferredOrientation,
          query,
          kind,
          searchIndex,
        })
      : 0;

  return {
    pageId: Number.isInteger(page.pageid) ? Number(page.pageid) : null,
    fileTitle,
    accepted,
    rejectionReasons,
    score,
    width: sourceWidth,
    height: sourceHeight,
    thumbnailWidth: Number(info?.thumbwidth ?? sourceWidth),
    thumbnailHeight: Number(info?.thumbheight ?? sourceHeight),
    mime: effectiveMime || null,
    downloadUrl,
    originalFileUrl,
    sourcePageUrl,
    description,
    assessments,
    attribution,
  };
};

const parseRetryAfterMs = (response: Response): number | null => {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(30_000, seconds * 1000);
  }

  const date = Date.parse(retryAfter);
  if (Number.isFinite(date)) {
    return Math.min(30_000, Math.max(0, date - Date.now()));
  }

  return null;
};

const fetchWithRetry = async ({
  url,
  init,
  timeoutMs,
  label,
}: {
  url: string;
  init?: RequestInit;
  timeoutMs: number;
  label: string;
}): Promise<Response> => {
  const backoffMs = [0, 1_500, 4_000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt < backoffMs.length; attempt += 1) {
    if (backoffMs[attempt] > 0) {
      await sleep(backoffMs[attempt]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (response.ok) {
        return response;
      }

      const retryable = response.status === 429 || response.status >= 500;

      if (!retryable || attempt === backoffMs.length - 1) {
        throw new Error(
          `${label} HTTP ${response.status} ${response.statusText}`,
        );
      }

      const retryAfterMs = parseRetryAfterMs(response);
      if (retryAfterMs && retryAfterMs > 0) {
        await sleep(retryAfterMs);
      }
    } catch (error) {
      lastError = error;

      if (attempt === backoffMs.length - 1) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} request failed.`);
};

const fetchJson = async (url: string): Promise<WikimediaApiResponse> => {
  const response = await fetchWithRetry({
    url,
    timeoutMs: REQUEST_TIMEOUT_MS,
    label: "Wikimedia API",
    init: {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    },
  });

  return (await response.json()) as WikimediaApiResponse;
};

const searchWikimediaVisualsInternal = async ({
  searchQuery,
  relevanceQuery,
  kind,
  preferredOrientation,
  limit,
  searchIndexOffset = 0,
}: {
  searchQuery: string;
  relevanceQuery: string;
  kind: WikimediaVisualKind;
  preferredOrientation: WikimediaOrientation;
  limit: number;
  searchIndexOffset?: number;
}): Promise<WikimediaCandidate[]> => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: searchQuery,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|mime|size|thumbmime|extmetadata",
    iiurlwidth: String(THUMB_WIDTH),
    iiextmetadatalanguage: "en",
    iiextmetadatafilter: [
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

  const response = await fetchJson(`${COMMONS_API}?${params.toString()}`);

  if (response.error) {
    throw new Error(
      `Wikimedia API ${response.error.code ?? "error"}: ${response.error.info ?? "unknown error"}`,
    );
  }

  const pages = response.query?.pages ?? [];

  return pages
    .map((page, searchIndex) =>
      evaluatePage({
        page,
        query: relevanceQuery,
        kind,
        preferredOrientation,
        searchIndex: searchIndexOffset + searchIndex,
      }),
    )
    .sort((a, b) => {
      if (a.accepted !== b.accepted) {
        return a.accepted ? -1 : 1;
      }
      return b.score - a.score;
    });
};

export const searchWikimediaVisuals = async ({
  query,
  kind = "general",
  preferredOrientation = "landscape",
  limit = SEARCH_LIMIT_DEFAULT,
}: {
  query: string;
  kind?: WikimediaVisualKind;
  preferredOrientation?: WikimediaOrientation;
  limit?: number;
}): Promise<WikimediaCandidate[]> => {
  const cleanQuery = String(query ?? "").trim();
  if (!cleanQuery) {
    throw new Error("Wikimedia query is required.");
  }

  const safeLimit = Math.max(
    1,
    Math.min(
      SEARCH_LIMIT_MAX,
      Math.round(Number(limit) || SEARCH_LIMIT_DEFAULT),
    ),
  );

  return searchWikimediaVisualsInternal({
    searchQuery: cleanQuery,
    relevanceQuery: cleanQuery,
    kind,
    preferredOrientation,
    limit: safeLimit,
  });
};

const buildSearchVariants = (
  query: string,
  kind: WikimediaVisualKind,
): string[] => {
  const cleanQuery = String(query ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const rawTokens = normalizeText(cleanQuery).split(" ").filter(Boolean);
  const semanticTokens = rawTokens.filter(
    (token) =>
      !STOP_TOKENS.has(token) &&
      !VISUAL_DESCRIPTOR_TOKENS.has(token) &&
      !CONTEXT_TOKENS.has(token),
  );

  const variants = [cleanQuery];

  const compactTokens = rawTokens.filter(
    (token) => !VISUAL_DESCRIPTOR_TOKENS.has(token),
  );
  const compact = compactTokens.join(" ").trim();
  if (compact && normalizeText(compact) !== normalizeText(cleanQuery)) {
    variants.push(compact);
  }

  if (semanticTokens.length >= 2) {
    const quotedCore = `"${semanticTokens.slice(0, 2).join(" ")}"`;
    const intentSuffix = queryRequestsMap(cleanQuery)
      ? " map"
      : queryRequestsTimeline(cleanQuery)
        ? " timeline"
        : kind === "person"
          ? " portrait"
          : "";

    variants.push(`${quotedCore}${intentSuffix}`.trim());
  } else if (semanticTokens.length === 1) {
    const contextPlusCore = rawTokens
      .filter(
        (token) => CONTEXT_TOKENS.has(token) || token === semanticTokens[0],
      )
      .join(" ")
      .trim();

    variants.push(contextPlusCore || semanticTokens[0]);
  }

  return [
    ...new Set(variants.map((value) => value.trim()).filter(Boolean)),
  ].slice(0, MAX_SEARCH_VARIANTS);
};

const mergeCandidates = (
  target: Map<string, WikimediaCandidate>,
  candidates: WikimediaCandidate[],
) => {
  for (const candidate of candidates) {
    const key =
      candidate.pageId !== null
        ? `page:${candidate.pageId}`
        : `title:${normalizeText(candidate.fileTitle)}`;

    const existing = target.get(key);
    if (!existing || candidate.score > existing.score) {
      target.set(key, candidate);
    }
  }
};

const fileExistsAndUsable = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > MIN_DOWNLOAD_BYTES;
  } catch {
    return false;
  }
};

const detectImageMime = async (filePath: string): Promise<string | null> => {
  const handle = await fs.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const bytes = buffer.subarray(0, bytesRead);

    if (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    ) {
      return "image/jpeg";
    }

    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    if (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }

    return null;
  } finally {
    await handle.close();
  }
};

const downloadCandidate = async (
  candidate: WikimediaCandidate,
): Promise<DownloadResult> => {
  if (!candidate.downloadUrl) {
    throw new Error("Candidate has no download URL.");
  }

  const fileHash = crypto
    .createHash("sha256")
    .update(candidate.downloadUrl)
    .digest("hex")
    .slice(0, 32);

  for (const mime of SUPPORTED_IMAGE_MIMES) {
    const existingFileName = `${fileHash}${extensionForMime(mime)}`;
    const existingPath = path.join(FILES_DIR, existingFileName);

    if (await fileExistsAndUsable(existingPath)) {
      const detected = await detectImageMime(existingPath);
      if (detected && isSupportedImageMime(detected)) {
        return {
          fileName: existingFileName,
          mime: detected,
          alreadyDownloaded: true,
        };
      }
    }
  }

  const response = await fetchWithRetry({
    url: candidate.downloadUrl,
    timeoutMs: DOWNLOAD_TIMEOUT_MS,
    label: "Wikimedia image",
    init: {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/png,image/jpeg,image/webp,image/*;q=0.8,*/*;q=0.4",
      },
    },
  });

  const responseMime = normalizeMime(response.headers.get("content-type"));
  if (responseMime && !isSupportedImageMime(responseMime)) {
    throw new Error(`Unsupported Wikimedia response MIME: ${responseMime}`);
  }

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(
      `Wikimedia image exceeds ${MAX_DOWNLOAD_BYTES} byte cache limit.`,
    );
  }

  if (!response.body) {
    throw new Error("Wikimedia image response has no body.");
  }

  const temporaryPath = path.join(FILES_DIR, `${fileHash}.part`);
  await fs.rm(temporaryPath, { force: true });

  try {
    const nodeReadable = Readable.fromWeb(response.body as never);
    const fileHandle = await fs.open(temporaryPath, "w");

    try {
      await pipeline(nodeReadable, fileHandle.createWriteStream());
    } finally {
      await fileHandle.close();
    }

    const stat = await fs.stat(temporaryPath);

    if (stat.size <= MIN_DOWNLOAD_BYTES) {
      throw new Error(
        `Downloaded Wikimedia image is unexpectedly small: ${stat.size} bytes`,
      );
    }

    if (stat.size > MAX_DOWNLOAD_BYTES) {
      throw new Error(
        `Downloaded Wikimedia image exceeds ${MAX_DOWNLOAD_BYTES} bytes.`,
      );
    }

    const detectedMime = await detectImageMime(temporaryPath);
    const actualMime = detectedMime || responseMime;

    if (!actualMime || !isSupportedImageMime(actualMime)) {
      throw new Error("Downloaded Wikimedia file is not a supported image.");
    }

    const fileName = `${fileHash}${extensionForMime(actualMime)}`;
    const destination = path.join(FILES_DIR, fileName);

    await fs.rm(destination, { force: true });
    await fs.rename(temporaryPath, destination);

    return {
      fileName,
      mime: actualMime,
      alreadyDownloaded: false,
    };
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
};

const createResolutionKey = ({
  query,
  kind,
  preferredOrientation,
}: {
  query: string;
  kind: WikimediaVisualKind;
  preferredOrientation: WikimediaOrientation;
}): string =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        query: normalizeText(query),
        kind,
        preferredOrientation,
        policyVersion: POLICY_VERSION,
      }),
    )
    .digest("hex")
    .slice(0, 32);

const resolutionPathForKey = (key: string) =>
  path.join(RESOLUTIONS_DIR, `${key}.json`);

const localUrlForFile = (fileName: string) =>
  `${PUBLIC_BASE_URL}/files/${fileName}`;

const localPathForFile = (fileName: string) => path.join(FILES_DIR, fileName);

const resolvedFromCacheRecord = ({
  record,
  cacheHit,
}: {
  record: ResolutionCacheRecord;
  cacheHit: boolean;
}): WikimediaResolvedVisual => ({
  query: record.query,
  kind: record.kind,
  preferredOrientation: record.preferredOrientation,
  cacheHit,
  fileTitle: record.fileTitle,
  pageId: record.pageId,
  localUrl: localUrlForFile(record.fileName),
  localPath: localPathForFile(record.fileName),
  width: record.width,
  height: record.height,
  sourceWidth: record.sourceWidth,
  sourceHeight: record.sourceHeight,
  mime: record.mime,
  attribution: record.attribution,
  metadataPath: path.join(METADATA_DIR, record.metadataFileName),
});

const readResolutionCache = async (
  resolutionKey: string,
): Promise<WikimediaResolvedVisual | null> => {
  const manifestPath = resolutionPathForKey(resolutionKey);

  try {
    const record = JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as ResolutionCacheRecord;

    if (record.policyVersion !== POLICY_VERSION) {
      return null;
    }

    const localPath = localPathForFile(record.fileName);
    if (!(await fileExistsAndUsable(localPath))) {
      return null;
    }

    return resolvedFromCacheRecord({ record, cacheHit: true });
  } catch {
    return null;
  }
};

const formatCandidateFailureSummary = (
  candidates: WikimediaCandidate[],
): string =>
  candidates
    .slice(0, 5)
    .map(
      (candidate) =>
        `${candidate.fileTitle || "unknown"}: ${
          candidate.rejectionReasons.join("; ") || "not selected"
        }`,
    )
    .join(" | ");

export const resolveWikimediaVisual = async ({
  query,
  kind = "general",
  preferredOrientation = "landscape",
}: {
  query: string;
  kind?: WikimediaVisualKind;
  preferredOrientation?: WikimediaOrientation;
}): Promise<WikimediaResolvedVisual> => {
  const cleanQuery = String(query ?? "").trim();
  if (!cleanQuery) {
    throw new Error("Wikimedia query is required.");
  }

  await ensureCacheDirs();

  const resolutionKey = createResolutionKey({
    query: cleanQuery,
    kind,
    preferredOrientation,
  });

  const cached = await readResolutionCache(resolutionKey);
  if (cached) {
    return cached;
  }

  const variants = buildSearchVariants(cleanQuery, kind);
  const candidateMap = new Map<string, WikimediaCandidate>();

  for (
    let variantIndex = 0;
    variantIndex < variants.length;
    variantIndex += 1
  ) {
    if (variantIndex > 0) {
      await sleep(1_200);
    }

    const candidates = await searchWikimediaVisualsInternal({
      searchQuery: variants[variantIndex],
      relevanceQuery: cleanQuery,
      kind,
      preferredOrientation,
      limit: SEARCH_LIMIT_DEFAULT,
      searchIndexOffset: variantIndex * SEARCH_LIMIT_DEFAULT,
    });

    mergeCandidates(candidateMap, candidates);

    const acceptedCount = [...candidateMap.values()].filter(
      (candidate) => candidate.accepted,
    ).length;

    if (acceptedCount >= MIN_ACCEPTED_CANDIDATES_BEFORE_STOP) {
      break;
    }
  }

  const candidates = [...candidateMap.values()].sort((a, b) => {
    if (a.accepted !== b.accepted) {
      return a.accepted ? -1 : 1;
    }
    return b.score - a.score;
  });

  const eligibleCandidates = candidates.filter(
    (candidate) =>
      candidate.accepted &&
      candidate.attribution &&
      candidate.downloadUrl &&
      candidate.mime,
  );

  if (eligibleCandidates.length === 0) {
    throw new Error(
      `No Wikimedia candidate passed CurioMint licensing/quality policy for "${cleanQuery}". ${formatCandidateFailureSummary(candidates)}`,
    );
  }

  let selected: WikimediaCandidate | null = null;
  let downloadResult: DownloadResult | null = null;
  const downloadFailures: string[] = [];

  for (const candidate of eligibleCandidates) {
    try {
      downloadResult = await downloadCandidate(candidate);
      selected = candidate;
      break;
    } catch (error) {
      downloadFailures.push(
        `${candidate.fileTitle}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (!selected || !selected.attribution || !downloadResult) {
    throw new Error(
      `No downloadable Wikimedia candidate succeeded for "${cleanQuery}". ${
        downloadFailures.slice(0, 5).join(" | ") ||
        "No eligible download candidate."
      }`,
    );
  }

  const metadataFileName = `${path.parse(downloadResult.fileName).name}.json`;

  const metadataRecord = {
    query: cleanQuery,
    kind,
    preferredOrientation,
    selectedAt: new Date().toISOString(),
    searchVariants: variants,
    selectedCandidate: {
      pageId: selected.pageId,
      fileTitle: selected.fileTitle,
      score: selected.score,
      description: selected.description,
      assessments: selected.assessments,
      sourceWidth: selected.width,
      sourceHeight: selected.height,
      cachedWidth: selected.thumbnailWidth,
      cachedHeight: selected.thumbnailHeight,
      sourceMime: selected.mime,
      cachedMime: downloadResult.mime,
    },
    attribution: selected.attribution,
    policy: {
      version: POLICY_VERSION,
      acceptedLicenseClasses: ["public-domain", "cc0", "cc-by"],
      excludedByDefault: [
        "cc-by-sa",
        "gfdl",
        "noncommercial",
        "no-derivatives",
        "files-with-non-copyright-restrictions",
      ],
      rejectsUnrequestedDocumentContainers: true,
      relevanceGate: true,
      aspectRatioGate: true,
      downloadCandidateFallback: true,
      actualMimeDetection: true,
    },
  };

  await fs.writeFile(
    path.join(METADATA_DIR, metadataFileName),
    `${JSON.stringify(metadataRecord, null, 2)}\n`,
    "utf8",
  );

  const resolutionRecord: ResolutionCacheRecord = {
    query: cleanQuery,
    kind,
    preferredOrientation,
    selectedAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
    fileName: downloadResult.fileName,
    metadataFileName,
    fileTitle: selected.fileTitle,
    pageId: selected.pageId,
    width: selected.thumbnailWidth,
    height: selected.thumbnailHeight,
    sourceWidth: selected.width,
    sourceHeight: selected.height,
    mime: downloadResult.mime,
    attribution: selected.attribution,
  };

  await fs.writeFile(
    resolutionPathForKey(resolutionKey),
    `${JSON.stringify(resolutionRecord, null, 2)}\n`,
    "utf8",
  );

  return resolvedFromCacheRecord({
    record: resolutionRecord,
    cacheHit: downloadResult.alreadyDownloaded,
  });
};

export const getWikimediaResolverStatus = async () => {
  await ensureCacheDirs();

  const [files, metadata, resolutions] = await Promise.all([
    fs.readdir(FILES_DIR),
    fs.readdir(METADATA_DIR),
    fs.readdir(RESOLUTIONS_DIR),
  ]);

  return {
    available: true,
    source: "Wikimedia Commons",
    api: COMMONS_API,
    cacheDirectory: WIKIMEDIA_CACHE_DIR,
    cachedFileCount: files.length,
    metadataCount: metadata.length,
    resolutionCount: resolutions.length,
    searchLimit: SEARCH_LIMIT_DEFAULT,
    thumbnailWidth: THUMB_WIDTH,
    policy: {
      version: POLICY_VERSION,
      acceptedLicenseClasses: ["public-domain", "cc0", "cc-by"],
      excludedByDefault: [
        "cc-by-sa",
        "gfdl",
        "noncommercial",
        "no-derivatives",
        "files-with-non-copyright-restrictions",
      ],
      rejectsUnrequestedDocumentContainers: true,
      relevanceGate: true,
      aspectRatioGate: true,
      downloadCandidateFallback: true,
      actualMimeDetection: true,
    },
    renderRuntimeExternalCalls: 0,
  };
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const isHttpUrl = (value: unknown): value is string =>
  typeof value === "string" &&
  (value.startsWith("http://") || value.startsWith("https://"));

const normalizeKind = (value: unknown): WikimediaVisualKind => {
  switch (value) {
    case "person":
    case "artifact":
    case "building":
    case "place":
    case "event":
    case "general":
      return value;
    default:
      return "general";
  }
};

const normalizeOrientation = (value: unknown): WikimediaOrientation => {
  switch (value) {
    case "landscape":
    case "portrait":
    case "square":
    case "any":
      return value;
    default:
      return "landscape";
  }
};

const enrichWikimediaMediaItem = async (
  media: unknown,
): Promise<{
  media: unknown;
  attribution: WikimediaAttribution | null;
}> => {
  if (!isPlainRecord(media)) {
    return { media, attribution: null };
  }

  const wikimedia = isPlainRecord(media.wikimedia) ? media.wikimedia : null;
  if (!wikimedia) {
    return { media, attribution: null };
  }

  if (media.type !== "image") {
    throw new Error(
      `Wikimedia resolver supports image media only; media "${String(media.id ?? "unknown")}" is "${String(media.type)}".`,
    );
  }

  const query = String(wikimedia.query ?? "").trim();
  if (!query) {
    throw new Error(
      `Wikimedia query is missing for media "${String(media.id ?? "unknown")}".`,
    );
  }

  try {
    const resolved = await resolveWikimediaVisual({
      query,
      kind: normalizeKind(wikimedia.kind),
      preferredOrientation: normalizeOrientation(
        wikimedia.preferredOrientation,
      ),
    });

    return {
      media: {
        ...media,
        url: resolved.localUrl,
        wikimedia: {
          ...wikimedia,
          query,
          resolved: true,
          cacheHit: resolved.cacheHit,
          fileTitle: resolved.fileTitle,
          pageId: resolved.pageId,
          attribution: resolved.attribution,
          unresolvedReason: undefined,
        },
      },
      attribution: resolved.attribution,
    };
  } catch (error) {
    const existingUrl = isHttpUrl(media.url) ? media.url : null;

    if (existingUrl) {
      return {
        media: {
          ...media,
          wikimedia: {
            ...wikimedia,
            query,
            resolved: false,
            unresolvedReason:
              error instanceof Error ? error.message : String(error),
          },
        },
        attribution: null,
      };
    }

    throw new Error(
      `Wikimedia resolution failed for media "${String(media.id ?? "unknown")}" (${query}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const enrichSectionWikimediaMedia = async (
  section: unknown,
): Promise<{
  section: unknown;
  attributions: WikimediaAttribution[];
}> => {
  if (!isPlainRecord(section) || !Array.isArray(section.media)) {
    return { section, attributions: [] };
  }

  const resolvedItems = await Promise.all(
    section.media.map(enrichWikimediaMediaItem),
  );

  return {
    section: {
      ...section,
      media: resolvedItems.map((item) => item.media),
    },
    attributions: resolvedItems
      .map((item) => item.attribution)
      .filter(
        (attribution): attribution is WikimediaAttribution =>
          attribution !== null,
      ),
  };
};

const dedupeAttributions = (
  attributions: WikimediaAttribution[],
): WikimediaAttribution[] => {
  const seen = new Set<string>();
  const output: WikimediaAttribution[] = [];

  for (const attribution of attributions) {
    const key =
      attribution.sourcePageUrl ||
      `${attribution.title}|${attribution.creditLine}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(attribution);
  }

  return output;
};

/**
 * Resolve Wikimedia media before the render job is hashed/queued.
 * Commons API/download calls may happen here on a cache miss.
 * Remotion itself receives only local media-cache URLs.
 */
export const enrichWikimediaVisualsInRenderProps = async (
  props: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const enriched: Record<string, unknown> = { ...props };
  const attributions: WikimediaAttribution[] = [];

  if (Array.isArray(props.sections)) {
    const sections = await Promise.all(
      props.sections.map(enrichSectionWikimediaMedia),
    );

    enriched.sections = sections.map((result) => result.section);

    for (const result of sections) {
      attributions.push(...result.attributions);
    }
  }

  if (Array.isArray(props.chapters)) {
    const chapters = await Promise.all(
      props.chapters.map(async (chapter) => {
        if (!isPlainRecord(chapter) || !Array.isArray(chapter.sections)) {
          return chapter;
        }

        const sections = await Promise.all(
          chapter.sections.map(enrichSectionWikimediaMedia),
        );

        for (const result of sections) {
          attributions.push(...result.attributions);
        }

        return {
          ...chapter,
          sections: sections.map((result) => result.section),
        };
      }),
    );

    enriched.chapters = chapters;
  }

  const existingAttributions = Array.isArray(props.wikimediaAttributions)
    ? props.wikimediaAttributions.filter(
        (value): value is WikimediaAttribution =>
          isPlainRecord(value) && typeof value.sourcePageUrl === "string",
      )
    : [];

  enriched.wikimediaAttributions = dedupeAttributions([
    ...existingAttributions,
    ...attributions,
  ]);

  return enriched;
};

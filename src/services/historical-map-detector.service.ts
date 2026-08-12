import fs from "fs";
import path from "path";

type JsonRecord = Record<string, unknown>;

type CliopatriaCatalogEntity = {
  id: string;
  name: string;
  normalizedName: string;
  wikidata?: string | null;
  wikipedia?: string | null;
  firstYear: number;
  lastYear: number;
  recordCount?: number;
  file?: string;
};

type CliopatriaIndex = {
  entities: CliopatriaCatalogEntity[];
};

export type HistoricalMapDetectorSection = {
  id: string;
  title?: string | null;
  subject?: string | null;
  narrationText?: string | null;
};

export type HistoricalMapDecision = {
  sectionId: string;

  useHistoricalMap: boolean;

  entity: string | null;

  year: number | null;

  score: number;

  evidence: string | null;
};

type Candidate = {
  entity: CliopatriaCatalogEntity;

  year: number;

  sentence: string;

  score: number;
};

let catalogCache: CliopatriaCatalogEntity[] | null = null;

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const containsPhrase = (haystack: string, needle: string): boolean => {
  if (!haystack || !needle) {
    return false;
  }

  return ` ${haystack} `.includes(` ${needle} `);
};

const POLITY_NAME_HINTS = [
  "empire",
  "kingdom",
  "khanate",
  "khaganate",
  "horde",
  "caliphate",
  "sultanate",
  "emirate",
  "dynasty",
  "republic",
  "confederation",
  "commonwealth",
  "duchy",
  "principality",
  "realm",
];

const STRONG_GEOPOLITICAL_TERMS = [
  "war",
  "wars",
  "conflict",
  "conflicts",
  "invasion",
  "invaded",
  "invades",
  "conquest",
  "conquered",
  "conquering",
  "siege",
  "besieged",
  "battle",
  "campaign",
  "campaigns",

  "annexed",
  "annexation",
  "occupied",
  "occupation",

  "territory",
  "territories",
  "territorial",

  "border",
  "borders",
  "frontier",
  "frontiers",

  "controlled",
  "controls",
  "control",

  "ruled",
  "rules",
  "ruling",

  "expanded",
  "expansion",

  "contracted",
  "contraction",

  "collapsed",
  "collapse",

  "spanned",
  "stretched",
  "extended",

  "military",
  "army",
  "armies",

  "geopolitical",
];

const GEOGRAPHIC_CONTEXT_TERMS = [
  "region",
  "regions",

  "route",
  "routes",

  "trade route",
  "trade routes",

  "black sea",
  "mediterranean",

  "coast",
  "coastal",

  "port",
  "ports",

  "land",
  "lands",

  "east",
  "west",
  "north",
  "south",

  "europe",
  "asia",
  "africa",

  "steppe",
  "steppes",

  "capital",
];

const LEGAL_SOCIAL_TERMS = [
  "law",
  "laws",

  "statute",
  "statutes",

  "ordinance",
  "ordinances",

  "regulation",
  "regulations",

  "wage",
  "wages",

  "labor",
  "labour",

  "worker",
  "workers",

  "employment",

  "tax",
  "taxes",

  "inheritance",

  "religion",
  "church",

  "culture",
  "cultural",

  "disease",
  "bacterium",

  "medicine",
  "medical",
];

const hasAnyPhrase = (normalizedText: string, phrases: string[]): boolean =>
  phrases.some((phrase) =>
    containsPhrase(normalizedText, normalizeText(phrase)),
  );

const splitIntoSentences = (value: string): string[] => {
  const matches = value.match(/[^.!?\n]+[.!?]?/g);

  if (!matches) {
    return [];
  }

  return matches.map((sentence) => sentence.trim()).filter(Boolean);
};

const extractExplicitYears = (sentence: string): number[] => {
  const years: number[] = [];

  /*
   * Exact year with optional era:
   *
   * 1347
   * 117 CE
   * 44 BCE
   *
   * "1340s" does not match because
   * the trailing "s" prevents the
   * required word boundary.
   */
  const regex = /\b(\d{1,4})\s*(BCE|BC|CE|AD)?\b/gi;

  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(sentence)) !== null) {
    const rawYear = Number(match[1]);

    const era = String(match[2] ?? "").toUpperCase();

    if (!Number.isInteger(rawYear) || rawYear === 0) {
      continue;
    }

    /*
     * Bare 1-2 digit numbers are too
     * ambiguous to treat as historical
     * years. They are allowed only when
     * an explicit era is present.
     */
    if (!era && rawYear < 100) {
      continue;
    }

    const year = era === "BC" || era === "BCE" ? -rawYear : rawYear;

    if (!years.includes(year)) {
      years.push(year);
    }
  }

  return years;
};

const findCliopatriaIndexPath = (): string => {
  const root = path.resolve(process.cwd(), ".data", "cliopatria");

  if (!fs.existsSync(root)) {
    throw new Error(`Cliopatria data directory is missing at ${root}.`);
  }

  const versionDirectories = fs
    .readdirSync(root, {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) =>
      b.localeCompare(a, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

  for (const directoryName of versionDirectories) {
    const candidate = path.join(root, directoryName, "index.json");

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No Cliopatria index.json was found under ${root}.`);
};

const loadCatalog = (): CliopatriaCatalogEntity[] => {
  if (catalogCache) {
    return catalogCache;
  }

  const indexPath = findCliopatriaIndexPath();

  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8")) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed.entities)) {
    throw new Error(
      `Cliopatria index has no valid entities array: ${indexPath}`,
    );
  }

  const entities: CliopatriaCatalogEntity[] = [];

  for (const rawEntity of parsed.entities) {
    if (!isRecord(rawEntity)) {
      continue;
    }

    const id = String(rawEntity.id ?? "").trim();

    const name = String(rawEntity.name ?? "").trim();

    const normalizedName = normalizeText(rawEntity.normalizedName ?? name);

    const firstYear = Number(rawEntity.firstYear);

    const lastYear = Number(rawEntity.lastYear);

    if (
      !id ||
      !name ||
      !normalizedName ||
      !Number.isFinite(firstYear) ||
      !Number.isFinite(lastYear)
    ) {
      continue;
    }

    /*
     * Very short entity names create
     * too much accidental matching.
     */
    if (normalizedName.length < 4) {
      continue;
    }

    entities.push({
      id,
      name,
      normalizedName,

      wikidata:
        typeof rawEntity.wikidata === "string" ? rawEntity.wikidata : null,

      wikipedia:
        typeof rawEntity.wikipedia === "string" ? rawEntity.wikipedia : null,

      firstYear,

      lastYear,

      recordCount: Number(rawEntity.recordCount ?? 0),

      file: typeof rawEntity.file === "string" ? rawEntity.file : undefined,
    });
  }

  /*
   * Longest names first prevents a
   * shorter overlapping entity from
   * beating the more specific match.
   */
  entities.sort((a, b) => b.normalizedName.length - a.normalizedName.length);

  catalogCache = entities;

  return entities;
};

const entityHasPolityHint = (entity: CliopatriaCatalogEntity): boolean =>
  hasAnyPhrase(entity.normalizedName, POLITY_NAME_HINTS);

const scoreCandidate = ({
  entity,
  normalizedSentence,
  normalizedTitle,
  normalizedSubject,
}: {
  entity: CliopatriaCatalogEntity;

  normalizedSentence: string;

  normalizedTitle: string;

  normalizedSubject: string;
}): number => {
  const hasStrongGeopoliticalContext = hasAnyPhrase(
    normalizedSentence,
    STRONG_GEOPOLITICAL_TERMS,
  );

  const hasGeographicContext = hasAnyPhrase(
    normalizedSentence,
    GEOGRAPHIC_CONTEXT_TERMS,
  );

  const hasLegalSocialContext = hasAnyPhrase(
    normalizedSentence,
    LEGAL_SOCIAL_TERMS,
  );

  const polityHint = entityHasPolityHint(entity);

  const entityIsCentral =
    containsPhrase(normalizedTitle, entity.normalizedName) ||
    containsPhrase(normalizedSubject, entity.normalizedName);

  /*
   * Hard eligibility:
   *
   * A map must explain actual historical
   * geography, not simply decorate a
   * section containing a country + date.
   */
  const qualifies =
    hasStrongGeopoliticalContext ||
    (polityHint && entityIsCentral && !hasLegalSocialContext) ||
    (polityHint && hasGeographicContext && !hasLegalSocialContext);

  if (!qualifies) {
    return -1;
  }

  let score = 0;

  if (hasStrongGeopoliticalContext) {
    score += 50;
  }

  if (polityHint) {
    score += 30;
  }

  if (hasGeographicContext) {
    score += 15;
  }

  if (entityIsCentral) {
    score += 20;
  }

  /*
   * Legal/social context does not
   * automatically reject a genuine
   * geopolitical sentence, but it lowers
   * priority when both are present.
   */
  if (hasLegalSocialContext) {
    score -= 15;
  }

  /*
   * Prefer more specific entity names
   * when scores are otherwise close.
   */
  score += Math.min(10, Math.floor(entity.normalizedName.length / 5));

  return score;
};

const findSectionCandidates = (
  section: HistoricalMapDetectorSection,
): Candidate[] => {
  const catalog = loadCatalog();

  const title = String(section.title ?? "").trim();

  const subject = String(section.subject ?? "").trim();

  const narrationText = String(section.narrationText ?? "").trim();

  const normalizedTitle = normalizeText(title);

  const normalizedSubject = normalizeText(subject);

  /*
   * Keep title separate but allow an
   * explicit entity+year title to qualify.
   */
  const sentences = splitIntoSentences(
    [title, narrationText].filter(Boolean).join(". "),
  );

  const candidates: Candidate[] = [];

  for (const sentence of sentences) {
    const years = extractExplicitYears(sentence);

    if (years.length === 0) {
      continue;
    }

    const normalizedSentence = normalizeText(sentence);

    if (!normalizedSentence) {
      continue;
    }

    for (const entity of catalog) {
      if (!containsPhrase(normalizedSentence, entity.normalizedName)) {
        continue;
      }

      for (const year of years) {
        /*
         * Coverage check is mandatory.
         * No representative year is ever
         * inferred from memory.
         */
        if (year < entity.firstYear || year > entity.lastYear) {
          continue;
        }

        const score = scoreCandidate({
          entity,
          normalizedSentence,
          normalizedTitle,
          normalizedSubject,
        });

        if (score < 0) {
          continue;
        }

        candidates.push({
          entity,
          year,
          sentence,
          score,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    /*
     * If tied, prefer the more
     * specific entity phrase.
     */
    return b.entity.normalizedName.length - a.entity.normalizedName.length;
  });

  return candidates;
};

export const detectHistoricalMapForSection = (
  section: HistoricalMapDetectorSection,
): HistoricalMapDecision => {
  const sectionId = String(section.id ?? "").trim();

  if (!sectionId) {
    throw new Error("Historical map detector requires section.id.");
  }

  /*
   * Opening / ending intentionally stay
   * clean regardless of text content.
   */
  if (sectionId === "opening" || sectionId === "ending") {
    return {
      sectionId,

      useHistoricalMap: false,

      entity: null,

      year: null,

      score: 0,

      evidence: null,
    };
  }

  const candidates = findSectionCandidates(section);

  const best = candidates[0];

  if (!best) {
    return {
      sectionId,

      useHistoricalMap: false,

      entity: null,

      year: null,

      score: 0,

      evidence: null,
    };
  }

  return {
    sectionId,

    useHistoricalMap: true,

    entity: best.entity.name,

    year: best.year,

    score: best.score,

    evidence: best.sentence,
  };
};

export const detectHistoricalMaps = (
  sections: HistoricalMapDetectorSection[],
): HistoricalMapDecision[] =>
  sections.map((section) => detectHistoricalMapForSection(section));

export const getHistoricalMapDetectorStatus = () => {
  try {
    const catalog = loadCatalog();

    return {
      available: true,
      entityCount: catalog.length,
    };
  } catch (error) {
    return {
      available: false,
      entityCount: 0,

      error: error instanceof Error ? error.message : String(error),
    };
  }
};

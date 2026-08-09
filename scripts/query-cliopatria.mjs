import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile =
  fileURLToPath(
    import.meta.url,
  );

const repoRoot =
  path.resolve(
    path.dirname(currentFile),
    "..",
  );

const dataRoot =
  path.join(
    repoRoot,
    ".data",
    "cliopatria",
    "v0.2.0",
  );

const indexPath =
  path.join(
    dataRoot,
    "index.json",
  );

const entitiesDir =
  path.join(
    dataRoot,
    "entities",
  );

const normalizeText = (
  value,
) =>
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

const [rawQuery, rawYear] =
  process.argv.slice(2);

if (!rawQuery) {
  console.error(
    'Usage: node scripts/query-cliopatria.mjs "Roman Empire" 117',
  );

  process.exit(1);
}

if (
  !fs.existsSync(
    indexPath,
  )
) {
  console.error(
    "Cliopatria local index is missing. Run the Task 18.4A setup first.",
  );

  process.exit(1);
}

const index =
  JSON.parse(
    fs.readFileSync(
      indexPath,
      "utf8",
    ),
  );

const query =
  normalizeText(
    rawQuery,
  );

const year =
  rawYear === undefined
    ? null
    : Number(rawYear);

if (
  rawYear !== undefined &&
  !Number.isFinite(year)
) {
  console.error(
    `Invalid year: ${rawYear}`,
  );

  process.exit(1);
}

const exact =
  index.entities.filter(
    (entity) =>
      entity.normalizedName ===
      query,
  );

const partial =
  index.entities.filter(
    (entity) =>
      entity.normalizedName.includes(
        query,
      ) ||
      query.includes(
        entity.normalizedName,
      ),
  );

const candidates =
  exact.length > 0
    ? exact
    : partial.slice(0, 12);

if (
  candidates.length === 0
) {
  console.log(
    JSON.stringify(
      {
        found: false,
        query:
          rawQuery,
        year,
        candidates: [],
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

const results =
  candidates.map(
    (candidate) => {
      const entityData =
        JSON.parse(
          fs.readFileSync(
            path.join(
              entitiesDir,
              candidate.file,
            ),
            "utf8",
          ),
        );

      const matchingRecords =
        year === null
          ? []
          : entityData.records.filter(
              (record) =>
                record.fromYear <=
                  year &&
                record.toYear >=
                  year,
            );

      return {
        entity: {
          id:
            candidate.id,
          name:
            candidate.name,
          firstYear:
            candidate.firstYear,
          lastYear:
            candidate.lastYear,
          wikidata:
            candidate.wikidata,
          wikipedia:
            candidate.wikipedia,
        },

        year,

        matched:
          year === null
            ? null
            : matchingRecords.length >
              0,

        matchingRecords:
          matchingRecords.map(
            (record) => ({
              fromYear:
                record.fromYear,
              toYear:
                record.toYear,
              areaKm2:
                record.areaKm2,
              type:
                record.type,
              wikidata:
                record.wikidata,
              seshatId:
                record.seshatId,
              geometryType:
                record.geometry
                  ?.type ??
                null,
            }),
          ),
      };
    },
  );

console.log(
  JSON.stringify(
    {
      found: true,
      query:
        rawQuery,
      year,
      candidateCount:
        candidates.length,
      results,
    },
    null,
    2,
  ),
);
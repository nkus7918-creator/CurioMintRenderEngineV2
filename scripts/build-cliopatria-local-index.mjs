import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const VERSION = "v0.2.0";

const SOURCE = {
  name: "Cliopatria",
  version: VERSION,
  repository:
    "https://github.com/Seshat-Global-History-Databank/cliopatria",
  release:
    "https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.0",
  zenodoDoi:
    "10.5281/zenodo.20274630",
  license:
    "CC BY 4.0",
  licenseUrl:
    "https://creativecommons.org/licenses/by/4.0/",
  authors: [
    "Ed Chalstrey",
    "James Bennett",
  ],
  coverage:
    "3400 BCE to 2024 CE",
};

const currentFile =
  fileURLToPath(import.meta.url);

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

const geoJsonPath =
  path.join(
    dataRoot,
    "raw",
    "cliopatria.geojson",
  );

const entitiesDir =
  path.join(
    dataRoot,
    "entities",
  );

const indexPath =
  path.join(
    dataRoot,
    "index.json",
  );

const publicMetaDir =
  path.join(
    repoRoot,
    "public",
    "assets",
    "Historical",
    "Cliopatria",
  );

const attributionPath =
  path.join(
    publicMetaDir,
    "attribution.json",
  );

const catalogPath =
  path.join(
    repoRoot,
    "src",
    "templates",
    "curiomint-documentary",
    "historical",
    "cliopatriaCatalog.generated.ts",
  );

const ensureDir = (dir) =>
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    },
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

const stringOrNull = (
  value,
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text || null;
};

const numberOrNull = (
  value,
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : null;
};

const makeEntityId = (
  normalizedName,
) =>
  crypto
    .createHash("sha1")
    .update(normalizedName)
    .digest("hex")
    .slice(0, 16);

const readProperty = (
  properties,
  ...names
) => {
  for (const name of names) {
    if (
      Object.prototype.hasOwnProperty.call(
        properties,
        name,
      )
    ) {
      return properties[name];
    }
  }

  return null;
};

const geometryTypeCount = {};

const main = () => {
  if (
    !fs.existsSync(
      geoJsonPath,
    )
  ) {
    throw new Error(
      `Cliopatria source not found: ${geoJsonPath}`,
    );
  }

  console.log(
    "Reading Cliopatria GeoJSON...",
  );

  const raw =
    fs.readFileSync(
      geoJsonPath,
      "utf8",
    );

  const collection =
    JSON.parse(raw);

  if (
    collection?.type !==
      "FeatureCollection" ||
    !Array.isArray(
      collection.features,
    )
  ) {
    throw new Error(
      "Cliopatria source is not a valid GeoJSON FeatureCollection.",
    );
  }

  ensureDir(entitiesDir);
  ensureDir(publicMetaDir);

  for (
    const entry of
    fs.readdirSync(
      entitiesDir,
    )
  ) {
    if (
      entry.endsWith(
        ".json",
      )
    ) {
      fs.rmSync(
        path.join(
          entitiesDir,
          entry,
        ),
      );
    }
  }

  const groups =
    new Map();

  let minYear =
    Infinity;

  let maxYear =
    -Infinity;

  let polityRecords = 0;
  let relationRecords = 0;
  let skippedRecords = 0;

  collection.features.forEach(
    (feature, featureIndex) => {
      const properties =
        feature.properties ??
        {};

      const name =
        stringOrNull(
          readProperty(
            properties,
            "Name",
            "name",
          ),
        );

      const fromYear =
        numberOrNull(
          readProperty(
            properties,
            "FromYear",
            "fromyear",
            "from_year",
          ),
        );

      const toYear =
        numberOrNull(
          readProperty(
            properties,
            "ToYear",
            "toyear",
            "to_year",
          ),
        );

      if (
        !name ||
        fromYear === null ||
        toYear === null ||
        !feature.geometry
      ) {
        skippedRecords += 1;
        return;
      }

      const normalizedName =
        normalizeText(name);

      if (!normalizedName) {
        skippedRecords += 1;
        return;
      }

      minYear =
        Math.min(
          minYear,
          fromYear,
        );

      maxYear =
        Math.max(
          maxYear,
          toYear,
        );

      const type =
        stringOrNull(
          readProperty(
            properties,
            "Type",
            "type",
          ),
        ) ??
        "POLITY";

      if (
        type.toUpperCase() ===
        "RELATION"
      ) {
        relationRecords += 1;
      } else {
        polityRecords += 1;
      }

      const geometryType =
        String(
          feature.geometry.type ??
          "Unknown",
        );

      geometryTypeCount[
        geometryType
      ] =
        (
          geometryTypeCount[
            geometryType
          ] ??
          0
        ) + 1;

      const record = {
        featureIndex,

        name,

        fromYear,

        toYear,

        areaKm2:
          numberOrNull(
            readProperty(
              properties,
              "Area",
              "area",
            ),
          ),

        type,

        wikipedia:
          stringOrNull(
            readProperty(
              properties,
              "Wikipedia",
              "wikipedia",
            ),
          ),

        wikidata:
          stringOrNull(
            readProperty(
              properties,
              "Wikidata",
              "wikidata",
            ),
          ),

        seshatId:
          stringOrNull(
            readProperty(
              properties,
              "SeshatID",
              "SeshatId",
              "seshatid",
            ),
          ),

        memberOf:
          readProperty(
            properties,
            "MemberOf",
            "memberof",
            "member_of",
          ) ?? null,

        components:
          readProperty(
            properties,
            "Components",
            "components",
          ) ?? null,

        geometry:
          feature.geometry,
      };

      const existing =
        groups.get(
          normalizedName,
        );

      if (existing) {
        existing.records.push(
          record,
        );

        if (
          !existing.wikidata &&
          record.wikidata
        ) {
          existing.wikidata =
            record.wikidata;
        }

        if (
          !existing.wikipedia &&
          record.wikipedia
        ) {
          existing.wikipedia =
            record.wikipedia;
        }
      } else {
        groups.set(
          normalizedName,
          {
            name,
            normalizedName,
            entityId:
              makeEntityId(
                normalizedName,
              ),
            wikidata:
              record.wikidata,
            wikipedia:
              record.wikipedia,
            records: [
              record,
            ],
          },
        );
      }
    },
  );

  const catalog = [];

  for (
    const group of
    groups.values()
  ) {
    group.records.sort(
      (a, b) =>
        a.fromYear -
          b.fromYear ||
        a.toYear -
          b.toYear,
    );

    const firstYear =
      Math.min(
        ...group.records.map(
          (record) =>
            record.fromYear,
        ),
      );

    const lastYear =
      Math.max(
        ...group.records.map(
          (record) =>
            record.toYear,
        ),
      );

    const fileName =
      `${group.entityId}.json`;

    fs.writeFileSync(
      path.join(
        entitiesDir,
        fileName,
      ),
      JSON.stringify(
        {
          source: SOURCE,
          entity: {
            id:
              group.entityId,
            name:
              group.name,
            normalizedName:
              group.normalizedName,
            wikidata:
              group.wikidata,
            wikipedia:
              group.wikipedia,
            firstYear,
            lastYear,
          },
          records:
            group.records,
        },
      ),
      "utf8",
    );

    catalog.push({
      id:
        group.entityId,

      name:
        group.name,

      normalizedName:
        group.normalizedName,

      wikidata:
        group.wikidata,

      wikipedia:
        group.wikipedia,

      firstYear,

      lastYear,

      recordCount:
        group.records.length,

      file:
        fileName,
    });
  }

  catalog.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
      ),
  );

  const index = {
    source: SOURCE,

    generatedAt:
      new Date().toISOString(),

    stats: {
      recordCount:
        collection.features.length,

      indexedRecordCount:
        polityRecords +
        relationRecords,

      skippedRecords,

      entityCount:
        catalog.length,

      polityRecords,

      relationRecords,

      minYear:
        Number.isFinite(
          minYear,
        )
          ? minYear
          : null,

      maxYear:
        Number.isFinite(
          maxYear,
        )
          ? maxYear
          : null,

      geometryTypes:
        geometryTypeCount,
    },

    entities:
      catalog,
  };

  fs.writeFileSync(
    indexPath,
    JSON.stringify(
      index,
      null,
      2,
    ) + "\n",
    "utf8",
  );

  fs.writeFileSync(
    attributionPath,
    JSON.stringify(
      {
        title:
          "Cliopatria historical polity boundaries",

        source:
          SOURCE.name,

        version:
          SOURCE.version,

        authors:
          SOURCE.authors,

        repository:
          SOURCE.repository,

        zenodoDoi:
          SOURCE.zenodoDoi,

        license:
          SOURCE.license,

        licenseUrl:
          SOURCE.licenseUrl,

        modifications:
          "CurioMint creates local indexes, time-based selections, projections, and rendered visualizations from the source GeoJSON.",

        recommendedCredit:
          "Historical boundary data: Cliopatria / Seshat Global History Databank, CC BY 4.0.",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const generatedCatalog =
`/*
 * AUTO-GENERATED by scripts/build-cliopatria-local-index.mjs
 *
 * Geometry is intentionally NOT bundled into the Remotion source.
 * Full geometry stays in .data/cliopatria and is resolved server-side.
 *
 * Source: Cliopatria ${SOURCE.version}
 * License: CC BY 4.0
 */

export interface CliopatriaCatalogEntity {
  id: string;
  name: string;
  normalizedName: string;
  wikidata: string | null;
  wikipedia: string | null;
  firstYear: number;
  lastYear: number;
  recordCount: number;
  file: string;
}

export const CLIOPATRIA_SOURCE = ${JSON.stringify(
  SOURCE,
  null,
  2,
)} as const;

export const CLIOPATRIA_CATALOG = ${JSON.stringify(
  catalog,
  null,
  2,
)} as const satisfies readonly CliopatriaCatalogEntity[];

export const CLIOPATRIA_ENTITY_COUNT =
  CLIOPATRIA_CATALOG.length;
`;

  fs.writeFileSync(
    catalogPath,
    generatedCatalog,
    "utf8",
  );

  console.log("");
  console.log(
    `Indexed ${index.stats.indexedRecordCount} records into ${catalog.length} entity files.`,
  );
  console.log(
    `Year coverage: ${index.stats.minYear} to ${index.stats.maxYear}.`,
  );
  console.log(
    `POLITY records: ${polityRecords}. RELATION records: ${relationRecords}.`,
  );
  console.log(
    `Skipped records: ${skippedRecords}.`,
  );
  console.log(
    `Local index: ${indexPath}`,
  );
  console.log(
    `Generated catalog: ${catalogPath}`,
  );
};

main();
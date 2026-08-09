import fs from "fs";
import path from "path";

const args =
  process.argv.slice(2);

const argValue = (
  name,
) => {
  const index =
    args.indexOf(
      name,
    );

  return index >= 0
    ? args[index + 1]
    : undefined;
};

const csvPath =
  argValue(
    "--csv",
  );

const outputDir =
  argValue(
    "--out",
  );

if (
  !csvPath ||
  !outputDir
) {
  console.error(
    "Usage: node scripts/build-ucdp-ged-index.mjs --csv <file.csv> --out <directory>",
  );

  process.exit(1);
}

const resolvedCsv =
  path.resolve(
    csvPath,
  );

const resolvedOutput =
  path.resolve(
    outputDir,
  );

const yearsDir =
  path.join(
    resolvedOutput,
    "years",
  );

fs.rmSync(
  resolvedOutput,
  {
    recursive: true,
    force: true,
  },
);

fs.mkdirSync(
  yearsDir,
  {
    recursive: true,
  },
);

const SOURCE_URL =
  "https://ucdp.uu.se/downloads/ged/ged261-csv.zip";

const VERSION =
  "26.1";

const COVERAGE_START =
  "1989-01-01";

const COVERAGE_END =
  "2025-12-31";

const citations = [
  "Davies, Shawn; Pettersson, Therese; Oberg, Magnus (2026). Organized violence 1989-2025, and violent political protests. Journal of Peace Research.",
  "Sundberg, Ralph; Melander, Erik (2013). Introducing the UCDP Georeferenced Event Dataset. Journal of Peace Research 50(4).",
  "Hogbladh, Stina (2026). UCDP GED Codebook version 26.1. Department of Peace and Conflict Research, Uppsala University.",
];

const numericFields =
  new Set([
    "id",
    "year",
    "type_of_violence",
    "conflict_new_id",
    "dyad_new_id",
    "side_a_new_id",
    "side_b_new_id",
    "country_id",
    "latitude",
    "longitude",
    "where_prec",
    "date_prec",
    "deaths_a",
    "deaths_b",
    "deaths_civilians",
    "deaths_unknown",
    "best",
    "high",
    "low",
  ]);

const integerFields =
  new Set([
    "id",
    "year",
    "type_of_violence",
    "conflict_new_id",
    "dyad_new_id",
    "side_a_new_id",
    "side_b_new_id",
    "country_id",
    "where_prec",
    "date_prec",
    "deaths_a",
    "deaths_b",
    "deaths_civilians",
    "deaths_unknown",
    "best",
    "high",
    "low",
  ]);

const keptFields = [
  "id",
  "year",
  "code_status",
  "type_of_violence",
  "conflict_new_id",
  "conflict_name",
  "dyad_new_id",
  "dyad_name",
  "side_a_new_id",
  "side_a",
  "side_b_new_id",
  "side_b",
  "country",
  "country_id",
  "region",
  "where_coordinates",
  "where_description",
  "adm_1",
  "adm_2",
  "latitude",
  "longitude",
  "where_prec",
  "date_start",
  "date_end",
  "date_prec",
  "deaths_a",
  "deaths_b",
  "deaths_civilians",
  "deaths_unknown",
  "best",
  "high",
  "low",
  "source_article",
  "source_original",
  "source_headline",
];

const normalizeCell = (
  field,
  value,
) => {
  const trimmed =
    typeof value ===
      "string"
      ? value.trim()
      : "";

  if (
    numericFields.has(
      field,
    )
  ) {
    if (!trimmed) {
      return null;
    }

    const number =
      Number(
        trimmed,
      );

    if (
      !Number.isFinite(
        number,
      )
    ) {
      return null;
    }

    return integerFields.has(
      field,
    )
      ? Math.trunc(
          number,
        )
      : number;
  }

  return trimmed
    ? trimmed
    : null;
};

const buffers =
  new Map();

const counts =
  {};

const eventIndex =
  {};

const FLUSH_THRESHOLD =
  1024 * 1024;

const flushYear = (
  year,
) => {
  const buffer =
    buffers.get(
      year,
    );

  if (!buffer) {
    return;
  }

  fs.appendFileSync(
    path.join(
      yearsDir,
      `${year}.jsonl`,
    ),
    buffer,
    "utf8",
  );

  buffers.set(
    year,
    "",
  );
};

const addEvent = (
  event,
) => {
  const year =
    Number(
      event.year,
    );

  if (
    !Number.isInteger(
      year,
    )
  ) {
    return;
  }

  const id =
    Number(
      event.id,
    );

  if (
    !Number.isInteger(
      id,
    )
  ) {
    return;
  }

  const line =
    `${JSON.stringify(event)}\n`;

  const next =
    (
      buffers.get(
        year,
      ) ??
      ""
    ) +
    line;

  buffers.set(
    year,
    next,
  );

  counts[
    String(year)
  ] =
    (
      counts[
        String(year)
      ] ??
      0
    ) +
    1;

  eventIndex[
    String(id)
  ] =
    year;

  if (
    next.length >=
    FLUSH_THRESHOLD
  ) {
    flushYear(
      year,
    );
  }
};

let headers =
  null;

let row =
  [];

let field =
  "";

let inQuotes =
  false;

let pendingQuote =
  false;

let rowCount =
  0;

const emitRow = (
  cells,
) => {
  if (!headers) {
    headers =
      cells.map(
        (
          cell,
          index,
        ) => {
          const value =
            index === 0
              ? cell.replace(
                  /^\uFEFF/,
                  "",
                )
              : cell;

          return value.trim();
        },
      );

    return;
  }

  if (
    cells.length ===
      1 &&
    cells[0] ===
      ""
  ) {
    return;
  }

  const source =
    {};

  for (
    let index = 0;
    index <
      headers.length;
    index += 1
  ) {
    source[
      headers[index]
    ] =
      cells[index] ??
      "";
  }

  const event =
    {};

  for (
    const key of
    keptFields
  ) {
    event[key] =
      normalizeCell(
        key,
        source[key],
      );
  }

  if (
    event.deaths_a ===
      null
  ) {
    event.deaths_a =
      0;
  }

  if (
    event.deaths_b ===
      null
  ) {
    event.deaths_b =
      0;
  }

  if (
    event.deaths_civilians ===
      null
  ) {
    event.deaths_civilians =
      0;
  }

  if (
    event.deaths_unknown ===
      null
  ) {
    event.deaths_unknown =
      0;
  }

  if (
    event.best ===
      null
  ) {
    event.best =
      0;
  }

  if (
    event.high ===
      null
  ) {
    event.high =
      0;
  }

  if (
    event.low ===
      null
  ) {
    event.low =
      0;
  }

  addEvent(
    event,
  );

  rowCount +=
    1;

  if (
    rowCount %
      25000 ===
    0
  ) {
    console.log(
      `Indexed ${rowCount.toLocaleString("en-US")} events...`,
    );
  }
};

const stream =
  fs.createReadStream(
    resolvedCsv,
    {
      encoding:
        "utf8",
    },
  );

stream.on(
  "data",
  (
    chunk,
  ) => {
    let index =
      0;

    while (
      index <
      chunk.length
    ) {
      let char =
        chunk[index];

      if (
        pendingQuote
      ) {
        pendingQuote =
          false;

        if (
          char ===
          '"'
        ) {
          field +=
            '"';

          index +=
            1;

          continue;
        }

        inQuotes =
          false;
      }

      if (
        inQuotes
      ) {
        if (
          char ===
          '"'
        ) {
          if (
            index + 1 <
            chunk.length
          ) {
            if (
              chunk[
                index + 1
              ] ===
              '"'
            ) {
              field +=
                '"';

              index +=
                2;

              continue;
            }

            inQuotes =
              false;

            index +=
              1;

            continue;
          }

          pendingQuote =
            true;

          index +=
            1;

          continue;
        }

        field +=
          char;

        index +=
          1;

        continue;
      }

      if (
        char ===
        '"'
      ) {
        inQuotes =
          true;

        index +=
          1;

        continue;
      }

      if (
        char ===
        ","
      ) {
        row.push(
          field,
        );

        field =
          "";

        index +=
          1;

        continue;
      }

      if (
        char ===
        "\n"
      ) {
        if (
          field.endsWith(
            "\r",
          )
        ) {
          field =
            field.slice(
              0,
              -1,
            );
        }

        row.push(
          field,
        );

        emitRow(
          row,
        );

        row =
          [];

        field =
          "";

        index +=
          1;

        continue;
      }

      field +=
        char;

      index +=
        1;
    }
  },
);

stream.on(
  "end",
  () => {
    if (
      field.length >
        0 ||
      row.length >
        0
    ) {
      row.push(
        field,
      );

      emitRow(
        row,
      );
    }

    for (
      const year of
      buffers.keys()
    ) {
      flushYear(
        year,
      );
    }

    const sortedYears =
      Object.fromEntries(
        Object.entries(
          counts,
        ).sort(
          (
            [a],
            [b],
          ) =>
            Number(a) -
            Number(b),
        ),
      );

    const manifest = {
      dataset:
        "UCDP Georeferenced Event Dataset",

      abbreviation:
        "UCDP GED",

      version:
        VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      sourceUrl:
        SOURCE_URL,

      coverageStart:
        COVERAGE_START,

      coverageEnd:
        COVERAGE_END,

      recordCount:
        rowCount,

      years:
        sortedYears,

      citations,
    };

    fs.writeFileSync(
      path.join(
        resolvedOutput,
        "manifest.json",
      ),
      JSON.stringify(
        manifest,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    fs.writeFileSync(
      path.join(
        resolvedOutput,
        "event-index.json",
      ),
      JSON.stringify(
        eventIndex,
      ),
      "utf8",
    );

    console.log("");
    console.log(
      `UCDP GED ${VERSION} index complete.`,
    );

    console.log(
      `Events: ${rowCount.toLocaleString("en-US")}`,
    );

    console.log(
      `Years: ${Object.keys(sortedYears).length}`,
    );

    console.log(
      `Output: ${resolvedOutput}`,
    );
  },
);

stream.on(
  "error",
  (
    error,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);
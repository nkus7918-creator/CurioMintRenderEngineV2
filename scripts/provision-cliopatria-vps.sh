#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

VERSION="v0.2.0"
SOURCE_URL="https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip"

DATA_ROOT="$ROOT/.data/cliopatria/$VERSION"
RAW_DIR="$DATA_ROOT/raw"
ZIP_PATH="$DATA_ROOT/cliopatria.geojson.zip"
TARGET_PATH="$RAW_DIR/cliopatria.geojson"

mkdir -p "$DATA_ROOT" "$RAW_DIR"

if ! command -v unzip >/dev/null 2>&1; then
  apt-get update
  apt-get install -y unzip
fi

if [ ! -s "$ZIP_PATH" ]; then
  echo "Downloading Cliopatria $VERSION..."
  curl -L \
    --fail \
    --retry 3 \
    --retry-delay 2 \
    -o "$ZIP_PATH" \
    "$SOURCE_URL"
else
  echo "Reusing existing Cliopatria archive."
fi

echo "Extracting Cliopatria..."
rm -rf "$RAW_DIR/extracted"
mkdir -p "$RAW_DIR/extracted"

unzip -o \
  "$ZIP_PATH" \
  -d "$RAW_DIR/extracted" \
  >/dev/null

CANDIDATE="$(
  find "$RAW_DIR/extracted" \
    -type f \
    \( -iname '*.geojson' -o -iname '*.json' \) \
    -printf '%s %p\n' \
  | sort -nr \
  | head -n 1 \
  | cut -d' ' -f2-
)"

if [ -z "$CANDIDATE" ]; then
  CANDIDATE="$(
    find "$RAW_DIR/extracted" \
      -type f \
      -printf '%s %p\n' \
    | sort -nr \
    | head -n 1 \
    | cut -d' ' -f2-
  )"
fi

if [ -z "$CANDIDATE" ]; then
  echo "No dataset file found inside Cliopatria archive." >&2
  exit 1
fi

echo "Using archive entry: $CANDIDATE"

cp "$CANDIDATE" "$TARGET_PATH"

echo "Building local Cliopatria index..."
node "$ROOT/scripts/build-cliopatria-local-index.mjs"

echo "Smoke test: Roman Empire @ 117"
node "$ROOT/scripts/query-cliopatria.mjs" "Roman Empire" 117 \
  | tee /tmp/curiomint-cliopatria-roman.json

grep -q '"matched": true' \
  /tmp/curiomint-cliopatria-roman.json

echo "Smoke test: Ottoman @ 1600"
node "$ROOT/scripts/query-cliopatria.mjs" "Ottoman" 1600 \
  | tee /tmp/curiomint-cliopatria-ottoman.json

grep -q '"matched": true' \
  /tmp/curiomint-cliopatria-ottoman.json

echo ""
echo "CLIOPATRIA VPS DATA PROVISIONED SUCCESSFULLY"
echo "Data root: $DATA_ROOT"
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )/.." &&
  pwd
)"

cd "$REPO_DIR"

VERSION="26.1"
URL="https://ucdp.uu.se/downloads/ged/ged261-csv.zip"

DATA_ROOT="$REPO_DIR/.data/ucdp-ged"
OUTPUT_DIR="$DATA_ROOT/$VERSION"
TEMP_DIR="$DATA_ROOT/_download"
ZIP_PATH="$TEMP_DIR/ged261-csv.zip"
EXTRACT_DIR="$TEMP_DIR/extracted"

mkdir -p "$TEMP_DIR"
rm -rf "$EXTRACT_DIR"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required."
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  apt-get update
  apt-get install -y unzip
fi

echo "Downloading UCDP GED 26.1..."
curl \
  --fail \
  --location \
  --retry 3 \
  --output "$ZIP_PATH" \
  "$URL"

mkdir -p "$EXTRACT_DIR"

echo "Extracting..."
unzip -q \
  -o \
  "$ZIP_PATH" \
  -d "$EXTRACT_DIR"

CSV_PATH="$(
  find "$EXTRACT_DIR" \
    -type f \
    -iname '*.csv' \
    -print \
    -quit
)"

if [[ -z "$CSV_PATH" ]]; then
  echo "UCDP GED CSV file was not found after extraction."
  exit 1
fi

echo "Building local yearly index..."

node \
  scripts/build-ucdp-ged-index.mjs \
  --csv "$CSV_PATH" \
  --out "$OUTPUT_DIR"

rm -rf "$TEMP_DIR"

echo ""
echo "UCDP GED VPS PROVISION SUCCESSFUL"
echo "Data: $OUTPUT_DIR"
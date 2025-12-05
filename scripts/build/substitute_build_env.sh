#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="$1"
ENV_FILE="$2"
OUT="$3"

# Extract variable names from the env file (left side of KEY=VALUE)
VARS=$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" | cut -d= -f1)

# Build envsubst variable list ($VAR1 $VAR2 ...)
VARLIST=""
for v in $VARS; do
  VARLIST="$VARLIST \$$v"
done
VARLIST="${VARLIST# }"   # remove leading space

# Export values from the env file
set -a
source "$ENV_FILE"
set +a

# Run envsubst only on the selected variables
envsubst "$VARLIST" < "$TEMPLATE" > "$OUT"

echo "Generated: $OUT"

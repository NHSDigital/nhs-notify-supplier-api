find ./sandbox/data/examples -type f -name '*.json' \
  | while read f; do \
    out=./specification/api/components/examples/${f#./sandbox/data/examples/}; \
    mkdir -p $(dirname $out); \
    jq '{ value: . }' "$f" > "$out"; \
  done

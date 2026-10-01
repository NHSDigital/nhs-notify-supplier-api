# Pending Letter Maintenance

Maintenance command for replaying stale pending letters.

The script reads a JSON file containing letter ids, looks each letter up in the
letters table, and only updates letters that:

- exist in the table
- are still in `PENDING` status
- have an `updatedAt` value older than one week

In write mode the script updates `updatedAt` to the current timestamp. In dry
run mode it reports what it would update without writing to DynamoDB.

## Prerequisites

Run the command while authenticated against the target AWS account.

Set these environment variables before running the script:

- `AWS_REGION`, for example `eu-west-2`
- `LETTERS_TABLE_NAME`, the DynamoDB letters table name

## Input File

The `--file` argument must point to a JSON file containing an array of letter
ids.

Example:

```json
[
  "letter-id-1",
  "letter-id-2"
]
```

## Usage

From `scripts/maintenance/replay-pending-letters`:

```bash
npm run replay-pending-letters -- --file ./ids.json --dryrun
```

To apply updates instead of running a dry run, omit `--dryrun`:

```bash
npm run replay-pending-letters -- --file ./ids.json
```

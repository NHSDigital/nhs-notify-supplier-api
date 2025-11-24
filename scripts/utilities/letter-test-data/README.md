# Test letter generator

Simple script to generate test data. It uploads a PDF to the test S3 bucket and inserts a new record in the database.

## Usage

Log in the desired AWS account and then run the command below. You may need to set the AWS_REGION envar (eu-west-2)

Note that the AWS account ID is required in order to resolve the bucket name.

```bash
npm run cli -- create-letter \
  --supplier-id supplier-id \
  --environment pr147 \
  --awsAccountId 820178564574 \
  --letter-id letter-id \
  --group-id group-id \
  --specification-id specification-id \
  --status PENDING
```

```bash
npm run cli -- create-letter-batch \
  --supplier-id supplier-id \
  --environment main \
  --awsAccountId 820178564574 \
  --group-id group-id \
  --specification-id specification-id \
  --status PENDING \
  --count 10
```

## Batch Creation Script

For creating multiple batches with different specification and group IDs, use the bash wrapper script:

```bash
./src/create-batch-letters.sh \
  --supplier-id supplier-id \
  --environment main \
  --awsAccountId 820178564574 \
  --count 25 \
  --status PENDING
```

This script creates 3 batches with the following configurations:

- Batch 1: `--specification-id integration-specification-english --group-id group-english`
- Batch 2: `--specification-id integration-specification-braille --group-id group-accessible`
- Batch 3: `--specification-id integration-specification-arabic --group-id group-international`

**Note:** The default configuration creates 2,505 letters total (835 letters × 3 batches) with an 18-month TTL.

### Script Options

- `--supplier-id` (required): Supplier ID for the letters
- `--environment` (required): Environment (e.g., pr147, main)
- `--awsAccountId` (required): AWS Account ID for S3 bucket resolution
- `--count` (optional): Number of letters per batch (default: 835)
- `--status` (optional): Letter status (default: PENDING)
- `--ttl-hours` (optional): TTL in hours (default: 13140, ~18 months)

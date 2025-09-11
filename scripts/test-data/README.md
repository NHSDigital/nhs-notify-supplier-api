# Test letter generator

Simple script to generate test data. It uploads a PDF to the test S3 bucket and inserts a new record in the database.

## Usage

Log in the desired AWS account and then run the command below. Note that the AWS account ID is required in order to resolve the bucket name.

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

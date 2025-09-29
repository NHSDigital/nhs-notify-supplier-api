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

# Test letter generator

Simple scripts to manipulate supplier data within the Suppliers table via the internal datastore definitions.

## Usage

Log in the desired AWS account and then run the command below. You may need to set the AWS_REGION envar (eu-west-2)

Note that the AWS account ID is required in order to resolve the bucket name.

```bash
npm run cli -- put-supplier \
  --id supplier-id \
  --name supplier \
  --apimId supplier-apim-id \
  --status ENABLED
  --environment pr147 \
```

```bash
npm run cli -- get-supplier-by-id \
  --id supplier-id \
  --environment main \
```

```bash
npm run cli -- get-supplier-by-apim-id \
  --apimId apim-supplier-id
  --environment main \
```

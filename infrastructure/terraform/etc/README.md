# THIS DIRECTORY SHOULD BE IGNORED IN THE CONTEXT OF THE NHS NOTIFY PROGRAMME AND IS INTENDED FOR INDEPENDENT DEVELOPMENT USE ONLY

## Example configuration files may look like this with the global.tfvars forming the base, any configuration will override with a most specific file taking presidence. env > region > group > Global

```env_eu-west-2_example.tfvars
environment = "example"
```

```eu-west-2.tfvars
region = "eu-west-2"
```

```group_example.tfvars
group = "example"
aws_account_id = "1234567890"
```

```global.tfvars
tfscaffold_bucket_prefix = "nhs-notify-tfscaffold"
project        = "myproject"
aws_account_id = "0987654321"
```

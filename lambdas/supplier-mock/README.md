<!-- vale off -->

# Supplier Mock

## What is does

The supplier-mock lambda simulates the supplier's system behaviour so that downstream services can simulate supplier interaction without relying on a live supplier system.
The mock simulates the journey of a letter with the Supplier. It utilises the api-handler and retrieves pending letters by calling the `getLetters` lambda directly and then provides status updates for each letter by calling the `patchLetter` lambda.
Each time the mock is called it will call `getLetters` once with for the **supplierId** `TestSupplier1` and with a **limit** of `100` letters. These default values can be configured in the AWS Parameter Store as explained in [How to modify parameter store variables](#how-to-modify-default-variable-values-in-parameter-store) . It then loops through each retrieved letter and updates its status by calling `patchLetter` and using the **specification_id_mapping** map to determine its status. If the map doesn't return a value it will default to `ACCEPTED` status.

## How to deploy the supapi-supplier-mock schedule

The AWS EventBridge Schedule that calls the supplier-mock lambda is created by the terraform file **/infrastructure/terraform/components/api/scheduler_supplier_mock.tf**, however, by default it's not deployed as it's not needed by every dynamic environment.
If you need to deploy the schedule in your environment you need to set the variable `deploy_supplier_mock_scheduler = true` in the file **/infrastructure/terraform/components/api/variables.tf**.

## How to run the lambda

The supplier-mock lambda can be activated by manually enabling the `{environment}-supapi-supplier-mock` AWS EventBridge schedule from the AWS console. The schedule is configured to call the lambda once per minute. You need to manually disable the schedule from the AWS console to stop calling the supplier-mock lambda.
**NOTE: The schedule is not deployed by default**

## How to modify default variable values in parameter store

As mentioned above the `limit`, `supplierId` and `specification_id_mapping` default values are stored in the AWS Parameter Store and can be modified if needed by accessing the Parameter Store from the AWS Console. These store parameters are created in the **/infrastructure/terraform/components/api/ssm_parameter.tf** file, but only if the `deploy_supplier_mock_scheduler` variable is set to `true`. We deploy a JSON parameter in the location `/nhs/supapi/{environment}/supplier-mock/config` with the following key/value pairs:

| key                      | type   | default value                           |
| ------------------------ | ------ | --------------------------------------- |
| limit                    | string | 100                                     |
| supplier_id              | string | TestSupplier1                           |
| specification_id_mapping | map    | {"test-specification-id-1 = "ACCEPTED"} |

<!-- vale on -->

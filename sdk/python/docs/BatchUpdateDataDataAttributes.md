# BatchUpdateDataDataAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | [**BatchStatus**](BatchStatus.md) | New status to be applied to the batch of letters | [optional] [default to BatchStatus.PENDING]
**reason_code** | **float** | Reason code for the given status | [optional] 
**reason_text** | **str** | Reason text for the given status | [optional] 

## Example

```python
from openapi_client.models.batch_update_data_data_attributes import BatchUpdateDataDataAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of BatchUpdateDataDataAttributes from a JSON string
batch_update_data_data_attributes_instance = BatchUpdateDataDataAttributes.from_json(json)
# print the JSON string representation of the object
print(BatchUpdateDataDataAttributes.to_json())

# convert the object into a dict
batch_update_data_data_attributes_dict = batch_update_data_data_attributes_instance.to_dict()
# create an instance of BatchUpdateDataDataAttributes from a dict
batch_update_data_data_attributes_from_dict = BatchUpdateDataDataAttributes.from_dict(batch_update_data_data_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



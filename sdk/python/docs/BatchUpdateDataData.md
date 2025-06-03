# BatchUpdateDataData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **object** |  | [optional]
**id** | **str** |  | [optional]
**attributes** | [**BatchUpdateDataDataAttributes**](BatchUpdateDataDataAttributes.md) |  | [optional]

## Example

```python
from openapi_client.models.batch_update_data_data import BatchUpdateDataData

# TODO update the JSON string below
json = "{}"
# create an instance of BatchUpdateDataData from a JSON string
batch_update_data_data_instance = BatchUpdateDataData.from_json(json)
# print the JSON string representation of the object
print(BatchUpdateDataData.to_json())

# convert the object into a dict
batch_update_data_data_dict = batch_update_data_data_instance.to_dict()
# create an instance of BatchUpdateDataData from a dict
batch_update_data_data_from_dict = BatchUpdateDataData.from_dict(batch_update_data_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

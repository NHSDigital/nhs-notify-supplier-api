# BatchResponseDataAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**download** | [**Download**](Download.md) |  | 
**letters** | [**List[Letter]**](Letter.md) |  | 

## Example

```python
from openapi_client.models.batch_response_data_attributes import BatchResponseDataAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of BatchResponseDataAttributes from a JSON string
batch_response_data_attributes_instance = BatchResponseDataAttributes.from_json(json)
# print the JSON string representation of the object
print(BatchResponseDataAttributes.to_json())

# convert the object into a dict
batch_response_data_attributes_dict = batch_response_data_attributes_instance.to_dict()
# create an instance of BatchResponseDataAttributes from a dict
batch_response_data_attributes_from_dict = BatchResponseDataAttributes.from_dict(batch_response_data_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



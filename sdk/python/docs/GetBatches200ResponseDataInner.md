# GetBatches200ResponseDataInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  |
**id** | **str** | ID of a batch which can be fetched from the /batch/{id} endpoint |

## Example

```python
from openapi_client.models.get_batches200_response_data_inner import GetBatches200ResponseDataInner

# TODO update the JSON string below
json = "{}"
# create an instance of GetBatches200ResponseDataInner from a JSON string
get_batches200_response_data_inner_instance = GetBatches200ResponseDataInner.from_json(json)
# print the JSON string representation of the object
print(GetBatches200ResponseDataInner.to_json())

# convert the object into a dict
get_batches200_response_data_inner_dict = get_batches200_response_data_inner_instance.to_dict()
# create an instance of GetBatches200ResponseDataInner from a dict
get_batches200_response_data_inner_from_dict = GetBatches200ResponseDataInner.from_dict(get_batches200_response_data_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

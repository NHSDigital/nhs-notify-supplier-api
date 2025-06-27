# GetBatches200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | [**GetBatches200ResponseLinks**](GetBatches200ResponseLinks.md) |  | [optional]
**data** | [**List[GetBatches200ResponseDataInner]**](GetBatches200ResponseDataInner.md) |  | [optional]

## Example

```python
from openapi_client.models.get_batches200_response import GetBatches200Response

# TODO update the JSON string below
json = "{}"
# create an instance of GetBatches200Response from a JSON string
get_batches200_response_instance = GetBatches200Response.from_json(json)
# print the JSON string representation of the object
print(GetBatches200Response.to_json())

# convert the object into a dict
get_batches200_response_dict = get_batches200_response_instance.to_dict()
# create an instance of GetBatches200Response from a dict
get_batches200_response_from_dict = GetBatches200Response.from_dict(get_batches200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

# GetBatches200ResponseLinks


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**var_self** | **str** |  | 
**first** | **str** |  | 
**last** | **str** |  | 
**prev** | **str** |  | [optional] 
**next** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.get_batches200_response_links import GetBatches200ResponseLinks

# TODO update the JSON string below
json = "{}"
# create an instance of GetBatches200ResponseLinks from a JSON string
get_batches200_response_links_instance = GetBatches200ResponseLinks.from_json(json)
# print the JSON string representation of the object
print(GetBatches200ResponseLinks.to_json())

# convert the object into a dict
get_batches200_response_links_dict = get_batches200_response_links_instance.to_dict()
# create an instance of GetBatches200ResponseLinks from a dict
get_batches200_response_links_from_dict = GetBatches200ResponseLinks.from_dict(get_batches200_response_links_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



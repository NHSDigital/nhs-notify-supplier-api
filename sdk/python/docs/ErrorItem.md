# ErrorItem


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional]
**code** | **str** |  | [optional]
**links** | [**ErrorItemLinks**](ErrorItemLinks.md) |  | [optional]
**status** | **str** |  | [optional]
**title** | **str** |  | [optional]
**detail** | **str** |  | [optional]

## Example

```python
from openapi_client.models.error_item import ErrorItem

# TODO update the JSON string below
json = "{}"
# create an instance of ErrorItem from a JSON string
error_item_instance = ErrorItem.from_json(json)
# print the JSON string representation of the object
print(ErrorItem.to_json())

# convert the object into a dict
error_item_dict = error_item_instance.to_dict()
# create an instance of ErrorItem from a dict
error_item_from_dict = ErrorItem.from_dict(error_item_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

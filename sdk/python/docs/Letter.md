# Letter


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message_id** | **str** |  |
**file_name** | **str** |  |
**sha256** | **str** | SHA 256 Hash of a file or other resource used to verify the expected content |

## Example

```python
from openapi_client.models.letter import Letter

# TODO update the JSON string below
json = "{}"
# create an instance of Letter from a JSON string
letter_instance = Letter.from_json(json)
# print the JSON string representation of the object
print(Letter.to_json())

# convert the object into a dict
letter_dict = letter_instance.to_dict()
# create an instance of Letter from a dict
letter_from_dict = Letter.from_dict(letter_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

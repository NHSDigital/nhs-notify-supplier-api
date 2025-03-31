# LetterAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**download** | [**Download**](Download.md) |  | [optional]
**letters** | [**List[Letter]**](Letter.md) |  | [optional]

## Example

```python
from openapi_client.models.letter_attributes import LetterAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of LetterAttributes from a JSON string
letter_attributes_instance = LetterAttributes.from_json(json)
# print the JSON string representation of the object
print(LetterAttributes.to_json())

# convert the object into a dict
letter_attributes_dict = letter_attributes_instance.to_dict()
# create an instance of LetterAttributes from a dict
letter_attributes_from_dict = LetterAttributes.from_dict(letter_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

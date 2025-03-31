# LetterData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **object** |  | [optional]
**id** | **str** |  | [optional]
**attributes** | [**LetterAttributes**](LetterAttributes.md) |  | [optional]

## Example

```python
from openapi_client.models.letter_data import LetterData

# TODO update the JSON string below
json = "{}"
# create an instance of LetterData from a JSON string
letter_data_instance = LetterData.from_json(json)
# print the JSON string representation of the object
print(LetterData.to_json())

# convert the object into a dict
letter_data_dict = letter_data_instance.to_dict()
# create an instance of LetterData from a dict
letter_data_from_dict = LetterData.from_dict(letter_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

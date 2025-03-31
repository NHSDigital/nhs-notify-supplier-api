# LetterStatuDataData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **object** |  | [optional]
**id** | **str** |  | [optional]
**attributes** | [**LetterStatuDataDataAttributes**](LetterStatuDataDataAttributes.md) |  | [optional]

## Example

```python
from openapi_client.models.letter_statu_data_data import LetterStatuDataData

# TODO update the JSON string below
json = "{}"
# create an instance of LetterStatuDataData from a JSON string
letter_statu_data_data_instance = LetterStatuDataData.from_json(json)
# print the JSON string representation of the object
print(LetterStatuDataData.to_json())

# convert the object into a dict
letter_statu_data_data_dict = letter_statu_data_data_instance.to_dict()
# create an instance of LetterStatuDataData from a dict
letter_statu_data_data_from_dict = LetterStatuDataData.from_dict(letter_statu_data_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

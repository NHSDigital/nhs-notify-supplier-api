# LetterUpdateDataData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | [optional] 
**id** | **str** |  | [optional] 
**attributes** | [**LetterUpdateDataDataAttributes**](LetterUpdateDataDataAttributes.md) |  | [optional] 

## Example

```python
from openapi_client.models.letter_update_data_data import LetterUpdateDataData

# TODO update the JSON string below
json = "{}"
# create an instance of LetterUpdateDataData from a JSON string
letter_update_data_data_instance = LetterUpdateDataData.from_json(json)
# print the JSON string representation of the object
print(LetterUpdateDataData.to_json())

# convert the object into a dict
letter_update_data_data_dict = letter_update_data_data_instance.to_dict()
# create an instance of LetterUpdateDataData from a dict
letter_update_data_data_from_dict = LetterUpdateDataData.from_dict(letter_update_data_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



# LetterStatusDataData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **object** |  | [optional] 
**id** | **str** |  | [optional] 
**attributes** | [**LetterStatusDataDataAttributes**](LetterStatusDataDataAttributes.md) |  | [optional] 

## Example

```python
from openapi_client.models.letter_status_data_data import LetterStatusDataData

# TODO update the JSON string below
json = "{}"
# create an instance of LetterStatusDataData from a JSON string
letter_status_data_data_instance = LetterStatusDataData.from_json(json)
# print the JSON string representation of the object
print(LetterStatusDataData.to_json())

# convert the object into a dict
letter_status_data_data_dict = letter_status_data_data_instance.to_dict()
# create an instance of LetterStatusDataData from a dict
letter_status_data_data_from_dict = LetterStatusDataData.from_dict(letter_status_data_data_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



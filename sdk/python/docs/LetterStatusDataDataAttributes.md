# LetterStatusDataDataAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | [**LetterStatus**](LetterStatus.md) |  | [default to LetterStatus.PENDING]
**requested_production_status** | [**ProductionStatus**](ProductionStatus.md) |  | 
**reason_code** | **float** | Reason code for the given status | [optional] 
**reason_text** | **str** | Reason text for the given status | [optional] 

## Example

```python
from openapi_client.models.letter_status_data_data_attributes import LetterStatusDataDataAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of LetterStatusDataDataAttributes from a JSON string
letter_status_data_data_attributes_instance = LetterStatusDataDataAttributes.from_json(json)
# print the JSON string representation of the object
print(LetterStatusDataDataAttributes.to_json())

# convert the object into a dict
letter_status_data_data_attributes_dict = letter_status_data_data_attributes_instance.to_dict()
# create an instance of LetterStatusDataDataAttributes from a dict
letter_status_data_data_attributes_from_dict = LetterStatusDataDataAttributes.from_dict(letter_status_data_data_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



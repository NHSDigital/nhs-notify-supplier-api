# LetterUpdateDataDataAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | [**LetterStatus**](LetterStatus.md) |  | [optional] [default to LetterStatus.PENDING]
**requested_production_status** | [**ProductionStatus**](ProductionStatus.md) | The requested production status for this letter. May only be set by NHS Notify. | [optional] 
**reason_code** | **float** | Reason code for the given status | [optional] 
**reason_text** | **str** | Reason text for the given status | [optional] 

## Example

```python
from openapi_client.models.letter_update_data_data_attributes import LetterUpdateDataDataAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of LetterUpdateDataDataAttributes from a JSON string
letter_update_data_data_attributes_instance = LetterUpdateDataDataAttributes.from_json(json)
# print the JSON string representation of the object
print(LetterUpdateDataDataAttributes.to_json())

# convert the object into a dict
letter_update_data_data_attributes_dict = letter_update_data_data_attributes_instance.to_dict()
# create an instance of LetterUpdateDataDataAttributes from a dict
letter_update_data_data_attributes_from_dict = LetterUpdateDataDataAttributes.from_dict(letter_update_data_data_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



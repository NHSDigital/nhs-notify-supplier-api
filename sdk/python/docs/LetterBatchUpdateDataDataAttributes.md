# LetterBatchUpdateDataDataAttributes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**status** | **str** | New status to be applied to the batch of letters | [optional] 
**reason_code** | **float** | Reason code for the given status | [optional] 
**reason_text** | **str** | Reason code for the given status | [optional] 

## Example

```python
from openapi_client.models.letter_batch_update_data_data_attributes import LetterBatchUpdateDataDataAttributes

# TODO update the JSON string below
json = "{}"
# create an instance of LetterBatchUpdateDataDataAttributes from a JSON string
letter_batch_update_data_data_attributes_instance = LetterBatchUpdateDataDataAttributes.from_json(json)
# print the JSON string representation of the object
print(LetterBatchUpdateDataDataAttributes.to_json())

# convert the object into a dict
letter_batch_update_data_data_attributes_dict = letter_batch_update_data_data_attributes_instance.to_dict()
# create an instance of LetterBatchUpdateDataDataAttributes from a dict
letter_batch_update_data_data_attributes_from_dict = LetterBatchUpdateDataDataAttributes.from_dict(letter_batch_update_data_data_attributes_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



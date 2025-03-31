# LettersResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**data** | [**LetterData**](LetterData.md) |  | [optional] 

## Example

```python
from openapi_client.models.letters_response import LettersResponse

# TODO update the JSON string below
json = "{}"
# create an instance of LettersResponse from a JSON string
letters_response_instance = LettersResponse.from_json(json)
# print the JSON string representation of the object
print(LettersResponse.to_json())

# convert the object into a dict
letters_response_dict = letters_response_instance.to_dict()
# create an instance of LettersResponse from a dict
letters_response_from_dict = LettersResponse.from_dict(letters_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



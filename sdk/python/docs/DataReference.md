# DataReference


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** | ID of a data file which can be requested from the /data/{id} endpoint | 
**sha256** | **str** | SHA 256 Hash of a file or other resource used to verify the expected content | 
**signature** | **str** | ECDSA Signature of a file or other resource used to verify the originator | 
**key** | **str** | Public ECDSA Key corresponding to a signature used to verify the originator of a file. This public key should correspond to one published by NHS Notify. | 

## Example

```python
from openapi_client.models.data_reference import DataReference

# TODO update the JSON string below
json = "{}"
# create an instance of DataReference from a JSON string
data_reference_instance = DataReference.from_json(json)
# print the JSON string representation of the object
print(DataReference.to_json())

# convert the object into a dict
data_reference_dict = data_reference_instance.to_dict()
# create an instance of DataReference from a dict
data_reference_from_dict = DataReference.from_dict(data_reference_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



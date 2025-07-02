# openapi_client.BatchApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_batch_id**](BatchApi.md#get_batch_id) | **GET** /batch/{id} | Retrieve a batch of letters
[**get_batches**](BatchApi.md#get_batches) | **GET** /batch | Retrieve a list of available letter batches
[**patch_letters_batch**](BatchApi.md#patch_letters_batch) | **PATCH** /batch/{id} | Update the status of a batch of letters


# **get_batch_id**
> BatchResponse get_batch_id(id, x_request_id, x_correlation_id=x_correlation_id)

Retrieve a batch of letters

Get details about a batch of letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.batch_response import BatchResponse
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:3000
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://127.0.0.1:3000"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.BatchApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve a batch of letters
        api_response = api_instance.get_batch_id(id, x_request_id, x_correlation_id=x_correlation_id)
        print("The response of BatchApi->get_batch_id:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BatchApi->get_batch_id: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**BatchResponse**](BatchResponse.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Batch of letters found |  -  |
**404** | Resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_batches**
> GetBatches200Response get_batches(x_request_id, x_correlation_id=x_correlation_id)

Retrieve a list of available letter batches

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.get_batches200_response import GetBatches200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:3000
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://127.0.0.1:3000"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.BatchApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve a list of available letter batches
        api_response = api_instance.get_batches(x_request_id, x_correlation_id=x_correlation_id)
        print("The response of BatchApi->get_batches:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BatchApi->get_batches: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**GetBatches200Response**](GetBatches200Response.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **patch_letters_batch**
> BatchUpdateData patch_letters_batch(id, x_request_id, body, x_correlation_id=x_correlation_id)

Update the status of a batch of letters

Update the status of a batch of letters by providing the new status in the request body.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.batch_update_data import BatchUpdateData
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:3000
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://127.0.0.1:3000"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.BatchApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    body = openapi_client.BatchUpdateData() # BatchUpdateData | 
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of a batch of letters
        api_response = api_instance.patch_letters_batch(id, x_request_id, body, x_correlation_id=x_correlation_id)
        print("The response of BatchApi->patch_letters_batch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BatchApi->patch_letters_batch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **body** | **BatchUpdateData**|  | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**BatchUpdateData**](BatchUpdateData.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: application/vnd.api+json
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Letters resources updated successfully |  -  |
**400** | Bad request, invalid input data |  -  |
**404** | Resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# openapi_client.LetterApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_a_list_of_letters**](LetterApi.md#get_a_list_of_letters) | **GET** /letter | Get a list of letters
[**get_letter_status**](LetterApi.md#get_letter_status) | **GET** /letter/{id} | Retrieve the status of a letter
[**patch_letters**](LetterApi.md#patch_letters) | **PATCH** /letter/{id} | Update the status of a letter
[**post_letter**](LetterApi.md#post_letter) | **POST** /letter | Update the status of multiple letters


# **get_a_list_of_letters**
> get_a_list_of_letters(status, x_request_id, x_correlation_id=x_correlation_id)

Get a list of letters

The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_status import LetterStatus
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
    api_instance = openapi_client.LetterApi(api_client)
    status = openapi_client.LetterStatus() # LetterStatus | Status of a letter
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Get a list of letters
        api_instance.get_a_list_of_letters(status, x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling LetterApi->get_a_list_of_letters: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **status** | [**LetterStatus**](.md)| Status of a letter | 
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_letter_status**
> LetterStatusData get_letter_status(id, x_request_id, x_correlation_id=x_correlation_id)

Retrieve the status of a letter

Get details the status of a letter.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_status_data import LetterStatusData
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
    api_instance = openapi_client.LetterApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve the status of a letter
        api_response = api_instance.get_letter_status(id, x_request_id, x_correlation_id=x_correlation_id)
        print("The response of LetterApi->get_letter_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling LetterApi->get_letter_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LetterStatusData**](LetterStatusData.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Letter status |  -  |
**404** | Could not find letter |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **patch_letters**
> LetterStatusData patch_letters(id, x_request_id, body, x_correlation_id=x_correlation_id)

Update the status of a letter

Update the status of a letter by providing the new status in the request body.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_status_data import LetterStatusData
from openapi_client.models.letter_update_data import LetterUpdateData
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
    api_instance = openapi_client.LetterApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    body = openapi_client.LetterUpdateData() # LetterUpdateData | 
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of a letter
        api_response = api_instance.patch_letters(id, x_request_id, body, x_correlation_id=x_correlation_id)
        print("The response of LetterApi->patch_letters:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling LetterApi->patch_letters: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **body** | **LetterUpdateData**|  | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LetterStatusData**](LetterStatusData.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: application/vnd.api+json
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Letter resource updated successfully |  -  |
**400** | Bad request, invalid input data |  -  |
**404** | Letter resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **post_letter**
> post_letter(x_request_id, x_correlation_id=x_correlation_id)

Update the status of multiple letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
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
    api_instance = openapi_client.LetterApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of multiple letters
        api_instance.post_letter(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling LetterApi->post_letter: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


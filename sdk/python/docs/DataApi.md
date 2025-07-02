# openapi_client.DataApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**get_data_id**](DataApi.md#get_data_id) | **GET** /data/{id} | Fetch a data file
[**head_data_id**](DataApi.md#head_data_id) | **HEAD** /data/{id} | Fetch data file metadata
[**post_data**](DataApi.md#post_data) | **POST** /data | Request a URL to upload a new data file


# **get_data_id**
> get_data_id(id, id2, x_request_id, x_correlation_id=x_correlation_id)

Fetch a data file

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
    api_instance = openapi_client.DataApi(api_client)
    id = 'id_example' # str |
    id2 = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch a data file
        api_instance.get_data_id(id, id2, x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DataApi->get_data_id: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  |
 **id2** | **str**| Unique identifier of this resource |
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID |
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional]

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**303** | See Other |  * Location - The signed S3 URL of the data file to download <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **head_data_id**
> head_data_id(id, id2, x_request_id, x_correlation_id=x_correlation_id)

Fetch data file metadata

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
    api_instance = openapi_client.DataApi(api_client)
    id = 'id_example' # str |
    id2 = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch data file metadata
        api_instance.head_data_id(id, id2, x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DataApi->head_data_id: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  |
 **id2** | **str**| Unique identifier of this resource |
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

# **post_data**
> post_data(x_request_id, x_correlation_id=x_correlation_id)

Request a URL to upload a new data file

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
    api_instance = openapi_client.DataApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Request a URL to upload a new data file
        api_instance.post_data(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DataApi->post_data: %s\n" % e)
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

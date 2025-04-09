# openapi_client.SpecificationApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_specification**](SpecificationApi.md#create_specification) | **POST** /specification | Create a new specification record
[**get_specification**](SpecificationApi.md#get_specification) | **GET** /specification/{id} | Fetch metadata about a specific specification
[**list_specification**](SpecificationApi.md#list_specification) | **GET** /specification | List specifications
[**patch_specification**](SpecificationApi.md#patch_specification) | **PATCH** /specification/{id} | Update metadata about a specific specification


# **create_specification**
> create_specification(x_request_id, x_correlation_id=x_correlation_id)

Create a new specification record

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
    api_instance = openapi_client.SpecificationApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new specification record
        api_instance.create_specification(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling SpecificationApi->create_specification: %s\n" % e)
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

# **get_specification**
> get_specification(id, x_request_id, x_correlation_id=x_correlation_id)

Fetch metadata about a specific specification

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
    api_instance = openapi_client.SpecificationApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about a specific specification
        api_instance.get_specification(id, x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling SpecificationApi->get_specification: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
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

# **list_specification**
> list_specification(x_request_id, x_correlation_id=x_correlation_id)

List specifications

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
    api_instance = openapi_client.SpecificationApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List specifications
        api_instance.list_specification(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling SpecificationApi->list_specification: %s\n" % e)
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

# **patch_specification**
> patch_specification(id, x_request_id, x_correlation_id=x_correlation_id)

Update metadata about a specific specification

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
    api_instance = openapi_client.SpecificationApi(api_client)
    id = 'id_example' # str | Unique identifier of this resource
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update metadata about a specific specification
        api_instance.patch_specification(id, x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling SpecificationApi->patch_specification: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**| Unique identifier of this resource | 
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


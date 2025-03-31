# openapi_client.DefaultApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancellation_get**](DefaultApi.md#cancellation_get) | **GET** /cancellation | Get a list of cancelled letters
[**create_artwork**](DefaultApi.md#create_artwork) | **POST** /artwork | Create a new artwork metadata record
[**create_mi**](DefaultApi.md#create_mi) | **POST** /mi | Create a new MI record
[**create_proof**](DefaultApi.md#create_proof) | **POST** /proof | Create a new proof metadata record
[**create_return**](DefaultApi.md#create_return) | **POST** /return | Create a new returned letter batch
[**create_specification**](DefaultApi.md#create_specification) | **POST** /specification | Create a new specification record
[**get_artwork**](DefaultApi.md#get_artwork) | **GET** /artwork/{id} | Fetch metadata about a specific artwork file
[**get_batch_id**](DefaultApi.md#get_batch_id) | **GET** /batch/{id} | Retrieve a batch of letters
[**get_batches**](DefaultApi.md#get_batches) | **GET** /batch | Retrieve a list of available letter batches
[**get_data**](DefaultApi.md#get_data) | **GET** /data/{id} | Fetch metadata about an existing data file
[**get_letter_status**](DefaultApi.md#get_letter_status) | **GET** /letter/{id} | Retrieve the status of a letter
[**get_mi**](DefaultApi.md#get_mi) | **GET** /mi/{id} | Fetch a specific MI record
[**get_proof**](DefaultApi.md#get_proof) | **GET** /proof/{id} | Fetch metadata about a specific proof file
[**get_return**](DefaultApi.md#get_return) | **GET** /return/{id} | Fetch metadata about a specific return batch
[**get_specification**](DefaultApi.md#get_specification) | **GET** /specification/{id} | Fetch metadata about a specific specification
[**letter_post**](DefaultApi.md#letter_post) | **POST** /letter | Update the status of multiple letters
[**list_artwork**](DefaultApi.md#list_artwork) | **GET** /artwork | List artwork files
[**list_mi**](DefaultApi.md#list_mi) | **GET** /mi | List MI records
[**list_proof**](DefaultApi.md#list_proof) | **GET** /proof | List proof files
[**list_return**](DefaultApi.md#list_return) | **GET** /return | List batches of returned letters
[**list_specification**](DefaultApi.md#list_specification) | **GET** /specification | List specifications
[**patch_artwork**](DefaultApi.md#patch_artwork) | **PATCH** /artwork/{id} | Update metadata about a specific artwork file
[**patch_letters**](DefaultApi.md#patch_letters) | **PATCH** /letter/{id} | Update the status of a letter
[**patch_letters_batch**](DefaultApi.md#patch_letters_batch) | **PATCH** /batch/{id} | Update the status of a batch of letters
[**patch_proof**](DefaultApi.md#patch_proof) | **PATCH** /proof/{id} | Update metadata about a specific proof file
[**patch_specification**](DefaultApi.md#patch_specification) | **PATCH** /specification/{id} | Update metadata about a specific specification
[**post_data**](DefaultApi.md#post_data) | **POST** /data | Request a URL to upload a new data file


# **cancellation_get**
> cancellation_get(x_request_id, x_correlation_id=x_correlation_id)

Get a list of cancelled letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Get a list of cancelled letters
        api_instance.cancellation_get(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->cancellation_get: %s\n" % e)
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

# **create_artwork**
> create_artwork(x_request_id, x_correlation_id=x_correlation_id)

Create a new artwork metadata record

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new artwork metadata record
        api_instance.create_artwork(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->create_artwork: %s\n" % e)
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

# **create_mi**
> create_mi(x_request_id, x_correlation_id=x_correlation_id)

Create a new MI record

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new MI record
        api_instance.create_mi(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->create_mi: %s\n" % e)
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

# **create_proof**
> create_proof(x_request_id, x_correlation_id=x_correlation_id)

Create a new proof metadata record

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new proof metadata record
        api_instance.create_proof(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->create_proof: %s\n" % e)
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

# **create_return**
> create_return(x_request_id, x_correlation_id=x_correlation_id)

Create a new returned letter batch

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new returned letter batch
        api_instance.create_return(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->create_return: %s\n" % e)
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

# **create_specification**
> create_specification(x_request_id, x_correlation_id=x_correlation_id)

Create a new specification record

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Create a new specification record
        api_instance.create_specification(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->create_specification: %s\n" % e)
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

# **get_artwork**
> get_artwork(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch metadata about a specific artwork file

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about a specific artwork file
        api_instance.get_artwork(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_artwork: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_batch_id**
> LettersResponse get_batch_id(x_request_id, id, x_correlation_id=x_correlation_id)

Retrieve a batch of letters

Get details about a batch of letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letters_response import LettersResponse
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve a batch of letters
        api_response = api_instance.get_batch_id(x_request_id, id, x_correlation_id=x_correlation_id)
        print("The response of DefaultApi->get_batch_id:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->get_batch_id: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LettersResponse**](LettersResponse.md)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Batch of letters found |  -  |
**404** | No batch of letters available |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_batches**
> get_batches(x_request_id, x_correlation_id=x_correlation_id)

Retrieve a list of available letter batches

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve a list of available letter batches
        api_instance.get_batches(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_batches: %s\n" % e)
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

# **get_data**
> get_data(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch metadata about an existing data file

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about an existing data file
        api_instance.get_data(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_data: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
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
> LetterStatuData get_letter_status(x_request_id, id, x_correlation_id=x_correlation_id)

Retrieve the status of a letter

Get details the status of a letter.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_statu_data import LetterStatuData
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Retrieve the status of a letter
        api_response = api_instance.get_letter_status(x_request_id, id, x_correlation_id=x_correlation_id)
        print("The response of DefaultApi->get_letter_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->get_letter_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LetterStatuData**](LetterStatuData.md)

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

# **get_mi**
> get_mi(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch a specific MI record

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch a specific MI record
        api_instance.get_mi(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_mi: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_proof**
> get_proof(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch metadata about a specific proof file

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about a specific proof file
        api_instance.get_proof(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_proof: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_return**
> get_return(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch metadata about a specific return batch

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about a specific return batch
        api_instance.get_return(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_return: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
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
> get_specification(x_request_id, id, x_correlation_id=x_correlation_id)

Fetch metadata about a specific specification

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Fetch metadata about a specific specification
        api_instance.get_specification(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->get_specification: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **letter_post**
> letter_post(x_request_id, x_correlation_id=x_correlation_id)

Update the status of multiple letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of multiple letters
        api_instance.letter_post(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->letter_post: %s\n" % e)
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

# **list_artwork**
> list_artwork(x_request_id, x_correlation_id=x_correlation_id)

List artwork files

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List artwork files
        api_instance.list_artwork(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->list_artwork: %s\n" % e)
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

# **list_mi**
> list_mi(x_request_id, x_correlation_id=x_correlation_id)

List MI records

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List MI records
        api_instance.list_mi(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->list_mi: %s\n" % e)
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

# **list_proof**
> list_proof(x_request_id, x_correlation_id=x_correlation_id)

List proof files

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List proof files
        api_instance.list_proof(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->list_proof: %s\n" % e)
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

# **list_return**
> list_return(x_request_id, x_correlation_id=x_correlation_id)

List batches of returned letters

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List batches of returned letters
        api_instance.list_return(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->list_return: %s\n" % e)
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

# **list_specification**
> list_specification(x_request_id, x_correlation_id=x_correlation_id)

List specifications

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # List specifications
        api_instance.list_specification(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->list_specification: %s\n" % e)
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

# **patch_artwork**
> patch_artwork(x_request_id, id, x_correlation_id=x_correlation_id)

Update metadata about a specific artwork file

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update metadata about a specific artwork file
        api_instance.patch_artwork(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->patch_artwork: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

void (empty response body)

### Authorization

[authorization](../README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **patch_letters**
> LetterUpdateData patch_letters(x_request_id, id, body, x_correlation_id=x_correlation_id)

Update the status of a letter

Update the status of a letter by providing the new status in the request body.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_update_data import LetterUpdateData
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    body = openapi_client.LetterUpdateData() # LetterUpdateData | 
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of a letter
        api_response = api_instance.patch_letters(x_request_id, id, body, x_correlation_id=x_correlation_id)
        print("The response of DefaultApi->patch_letters:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->patch_letters: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **body** | **LetterUpdateData**|  | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LetterUpdateData**](LetterUpdateData.md)

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

# **patch_letters_batch**
> LetterBatchUpdateData patch_letters_batch(x_request_id, id, body, x_correlation_id=x_correlation_id)

Update the status of a batch of letters

Update the status of a batch of letters by providing the new status in the request body.

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.models.letter_batch_update_data import LetterBatchUpdateData
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    body = openapi_client.LetterBatchUpdateData() # LetterBatchUpdateData | 
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update the status of a batch of letters
        api_response = api_instance.patch_letters_batch(x_request_id, id, body, x_correlation_id=x_correlation_id)
        print("The response of DefaultApi->patch_letters_batch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DefaultApi->patch_letters_batch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
 **body** | **LetterBatchUpdateData**|  | 
 **x_correlation_id** | **str**| An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | [optional] 

### Return type

[**LetterBatchUpdateData**](LetterBatchUpdateData.md)

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
**404** | Letter resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **patch_proof**
> patch_proof(x_request_id, id, x_correlation_id=x_correlation_id)

Update metadata about a specific proof file

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update metadata about a specific proof file
        api_instance.patch_proof(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->patch_proof: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
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
> patch_specification(x_request_id, id, x_correlation_id=x_correlation_id)

Update metadata about a specific specification

### Example

* OAuth Authentication (authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    id = 'id_example' # str | Unique identifier of this resource
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Update metadata about a specific specification
        api_instance.patch_specification(x_request_id, id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->patch_specification: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **x_request_id** | **str**| Unique request identifier, in the format of a GUID | 
 **id** | **str**| Unique identifier of this resource | 
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

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "http://localhost"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

configuration.access_token = os.environ["ACCESS_TOKEN"]

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.DefaultApi(api_client)
    x_request_id = 'x_request_id_example' # str | Unique request identifier, in the format of a GUID
    x_correlation_id = 'x_correlation_id_example' # str | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)

    try:
        # Request a URL to upload a new data file
        api_instance.post_data(x_request_id, x_correlation_id=x_correlation_id)
    except Exception as e:
        print("Exception when calling DefaultApi->post_data: %s\n" % e)
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


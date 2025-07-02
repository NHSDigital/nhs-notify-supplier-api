# .DataApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getDataId**](DataApi.md#getDataId) | **GET** /data/{id} | Fetch a data file
[**headDataId**](DataApi.md#headDataId) | **HEAD** /data/{id} | Fetch data file metadata
[**postData**](DataApi.md#postData) | **POST** /data | Request a URL to upload a new data file


# **getDataId**
> getDataId()


### Example


```typescript
import { createConfiguration, DataApi } from '';
import type { DataApiGetDataIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DataApi(configuration);

const request: DataApiGetDataIdRequest = {

  id: "id_example",
    // Unique identifier of this resource
  id2: "id_example",
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getDataId(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **id2** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

void (empty response body)

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**303** | See Other |  * Location - The signed S3 URL of the data file to download <br>  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **headDataId**
> headDataId()


### Example


```typescript
import { createConfiguration, DataApi } from '';
import type { DataApiHeadDataIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DataApi(configuration);

const request: DataApiHeadDataIdRequest = {

  id: "id_example",
    // Unique identifier of this resource
  id2: "id_example",
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.headDataId(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **id2** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

void (empty response body)

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **postData**
> postData()


### Example


```typescript
import { createConfiguration, DataApi } from '';
import type { DataApiPostDataRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DataApi(configuration);

const request: DataApiPostDataRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.postData(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

void (empty response body)

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

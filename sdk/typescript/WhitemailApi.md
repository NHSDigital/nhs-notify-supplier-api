# .WhitemailApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createWhitemail**](WhitemailApi.md#createWhitemail) | **POST** /whitemail | Create a new whitemail letter batch
[**getWhitemail**](WhitemailApi.md#getWhitemail) | **GET** /whitemail/{id} | Fetch metadata about a specific whitemail batch
[**listWhitemail**](WhitemailApi.md#listWhitemail) | **GET** /whitemail | List batches of whitemail letters


# **createWhitemail**
> createWhitemail()


### Example


```typescript
import { createConfiguration, WhitemailApi } from '';
import type { WhitemailApiCreateWhitemailRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WhitemailApi(configuration);

const request: WhitemailApiCreateWhitemailRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.createWhitemail(request);
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

# **getWhitemail**
> getWhitemail()


### Example


```typescript
import { createConfiguration, WhitemailApi } from '';
import type { WhitemailApiGetWhitemailRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WhitemailApi(configuration);

const request: WhitemailApiGetWhitemailRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // Unique identifier of this resource
  id: "id_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getWhitemail(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **id** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

void (empty response body)

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listWhitemail**
> listWhitemail()


### Example


```typescript
import { createConfiguration, WhitemailApi } from '';
import type { WhitemailApiListWhitemailRequest } from '';

const configuration = createConfiguration();
const apiInstance = new WhitemailApi(configuration);

const request: WhitemailApiListWhitemailRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.listWhitemail(request);
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



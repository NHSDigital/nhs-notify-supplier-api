# .MiApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createMi**](MiApi.md#createMi) | **POST** /mi | Create a new MI record
[**getMi**](MiApi.md#getMi) | **GET** /mi/{id} | Fetch a specific MI record
[**listMi**](MiApi.md#listMi) | **GET** /mi | List MI records


# **createMi**
> createMi()


### Example


```typescript
import { createConfiguration, MiApi } from '';
import type { MiApiCreateMiRequest } from '';

const configuration = createConfiguration();
const apiInstance = new MiApi(configuration);

const request: MiApiCreateMiRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.createMi(request);
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

# **getMi**
> getMi()


### Example


```typescript
import { createConfiguration, MiApi } from '';
import type { MiApiGetMiRequest } from '';

const configuration = createConfiguration();
const apiInstance = new MiApi(configuration);

const request: MiApiGetMiRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // Unique identifier of this resource
  id: "id_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getMi(request);
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

# **listMi**
> listMi()


### Example


```typescript
import { createConfiguration, MiApi } from '';
import type { MiApiListMiRequest } from '';

const configuration = createConfiguration();
const apiInstance = new MiApi(configuration);

const request: MiApiListMiRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.listMi(request);
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

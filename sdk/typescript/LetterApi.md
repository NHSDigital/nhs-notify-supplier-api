# .LetterApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAListOfLetters**](LetterApi.md#getAListOfLetters) | **GET** /letter | Get a list of letters
[**getLetterStatus**](LetterApi.md#getLetterStatus) | **GET** /letter/{id} | Retrieve the status of a letter
[**patchLetters**](LetterApi.md#patchLetters) | **PATCH** /letter/{id} | Update the status of a letter
[**postLetter**](LetterApi.md#postLetter) | **POST** /letter | Update the status of multiple letters


# **getAListOfLetters**
> getAListOfLetters()

The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query

### Example


```typescript
import { createConfiguration, LetterApi } from '';
import type { LetterApiGetAListOfLettersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LetterApi(configuration);

const request: LetterApiGetAListOfLettersRequest = {
    // Status of a letter
  status: "PENDING",
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getAListOfLetters(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **status** | **LetterStatus** | Status of a letter | defaults to undefined
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

# **getLetterStatus**
> LetterStatusData getLetterStatus()

Get details the status of a letter.

### Example


```typescript
import { createConfiguration, LetterApi } from '';
import type { LetterApiGetLetterStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LetterApi(configuration);

const request: LetterApiGetLetterStatusRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // Unique identifier of this resource
  id: "id_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getLetterStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **id** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

**LetterStatusData**

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Letter status |  -  |
**404** | Resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **patchLetters**
> LetterStatusData patchLetters(body)

Update the status of a letter by providing the new status in the request body.

### Example


```typescript
import { createConfiguration, LetterApi } from '';
import type { LetterApiPatchLettersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LetterApi(configuration);

const request: LetterApiPatchLettersRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // Unique identifier of this resource
  id: "id_example",
  
  body: {
    data: {
      type: "Letter",
      id: "id_example",
      attributes: {
        status: "PENDING",
        requestedProductionStatus: "ACTIVE",
        reasonCode: 3.14,
        reasonText: "reasonText_example",
      },
    },
  },
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.patchLetters(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **LetterUpdateData**|  |
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **id** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

**LetterStatusData**

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: application/vnd.api+json
 - **Accept**: application/vnd.api+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Letter resource updated successfully |  -  |
**400** | Bad request, invalid input data |  -  |
**404** | Resource not found |  -  |
**429** | Too many requests |  -  |
**500** | Server error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **postLetter**
> postLetter()


### Example


```typescript
import { createConfiguration, LetterApi } from '';
import type { LetterApiPostLetterRequest } from '';

const configuration = createConfiguration();
const apiInstance = new LetterApi(configuration);

const request: LetterApiPostLetterRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.postLetter(request);
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



# .BatchApi

All URIs are relative to *http://127.0.0.1:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getBatchId**](BatchApi.md#getBatchId) | **GET** /batch/{id} | Retrieve a batch of letters
[**getBatches**](BatchApi.md#getBatches) | **GET** /batch | Retrieve a list of available letter batches
[**patchLettersBatch**](BatchApi.md#patchLettersBatch) | **PATCH** /batch/{id} | Update the status of a batch of letters


# **getBatchId**
> BatchResponse getBatchId()

Get details about a batch of letters

### Example


```typescript
import { createConfiguration, BatchApi } from '';
import type { BatchApiGetBatchIdRequest } from '';

const configuration = createConfiguration();
const apiInstance = new BatchApi(configuration);

const request: BatchApiGetBatchIdRequest = {
    // Unique identifier of this resource
  id: "id_example",
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getBatchId(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

**BatchResponse**

### Authorization

[authorization](README.md#authorization)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getBatches**
> GetBatches200Response getBatches()


### Example


```typescript
import { createConfiguration, BatchApi } from '';
import type { BatchApiGetBatchesRequest } from '';

const configuration = createConfiguration();
const apiInstance = new BatchApi(configuration);

const request: BatchApiGetBatchesRequest = {
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.getBatches(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

**GetBatches200Response**

### Authorization

[authorization](README.md#authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/vnd.api+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **patchLettersBatch**
> BatchUpdateData patchLettersBatch(body)

Update the status of a batch of letters by providing the new status in the request body.

### Example


```typescript
import { createConfiguration, BatchApi } from '';
import type { BatchApiPatchLettersBatchRequest } from '';

const configuration = createConfiguration();
const apiInstance = new BatchApi(configuration);

const request: BatchApiPatchLettersBatchRequest = {
    // Unique identifier of this resource
  id: "id_example",
    // Unique request identifier, in the format of a GUID
  xRequestID: "X-Request-ID_example",
  
  body: {
    data: {
      type: null,
      id: "id_example",
      attributes: {
        status: "PENDING",
        reasonCode: 3.14,
        reasonText: "reasonText_example",
      },
    },
  },
    // An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
  xCorrelationID: "X-Correlation-ID_example",
};

const data = await apiInstance.patchLettersBatch(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **BatchUpdateData**|  |
 **id** | [**string**] | Unique identifier of this resource | defaults to undefined
 **xRequestID** | [**string**] | Unique request identifier, in the format of a GUID | defaults to undefined
 **xCorrelationID** | [**string**] | An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. | (optional) defaults to undefined


### Return type

**BatchUpdateData**

### Authorization

[authorization](README.md#authorization)

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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)



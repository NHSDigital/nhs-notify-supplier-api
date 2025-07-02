// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile, HttpInfo} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';



/**
 * no description
 */
export class DataApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Fetch a data file
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param xCorrelationID An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public async getDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("DataApi", "getDataId", "id");
        }


        // verify required parameter 'id2' is not null or undefined
        if (id2 === null || id2 === undefined) {
            throw new RequiredError("DataApi", "getDataId", "id2");
        }


        // verify required parameter 'xRequestID' is not null or undefined
        if (xRequestID === null || xRequestID === undefined) {
            throw new RequiredError("DataApi", "getDataId", "xRequestID");
        }



        // Path Params
        const localVarPath = '/data/{id}'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)))
            .replace('{' + 'id' + '}', encodeURIComponent(String(id2)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("X-Request-ID", ObjectSerializer.serialize(xRequestID, "string", ""));

        // Header Params
        requestContext.setHeaderParam("X-Correlation-ID", ObjectSerializer.serialize(xCorrelationID, "string", ""));


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["authorization"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Fetch data file metadata
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param xCorrelationID An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public async headDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("DataApi", "headDataId", "id");
        }


        // verify required parameter 'id2' is not null or undefined
        if (id2 === null || id2 === undefined) {
            throw new RequiredError("DataApi", "headDataId", "id2");
        }


        // verify required parameter 'xRequestID' is not null or undefined
        if (xRequestID === null || xRequestID === undefined) {
            throw new RequiredError("DataApi", "headDataId", "xRequestID");
        }



        // Path Params
        const localVarPath = '/data/{id}'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)))
            .replace('{' + 'id' + '}', encodeURIComponent(String(id2)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.HEAD);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("X-Request-ID", ObjectSerializer.serialize(xRequestID, "string", ""));

        // Header Params
        requestContext.setHeaderParam("X-Correlation-ID", ObjectSerializer.serialize(xCorrelationID, "string", ""));


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["authorization"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Request a URL to upload a new data file
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param xCorrelationID An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public async postData(xRequestID: string, xCorrelationID?: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'xRequestID' is not null or undefined
        if (xRequestID === null || xRequestID === undefined) {
            throw new RequiredError("DataApi", "postData", "xRequestID");
        }



        // Path Params
        const localVarPath = '/data';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")

        // Header Params
        requestContext.setHeaderParam("X-Request-ID", ObjectSerializer.serialize(xRequestID, "string", ""));

        // Header Params
        requestContext.setHeaderParam("X-Correlation-ID", ObjectSerializer.serialize(xCorrelationID, "string", ""));


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["authorization"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }

        const defaultAuth: SecurityAuthentication | undefined = _config?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class DataApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDataId
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDataIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo< void>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("303", response.httpStatusCode)) {
            throw new ApiException<undefined>(response.httpStatusCode, "See Other", undefined, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to headDataId
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async headDataIdWithHttpInfo(response: ResponseContext): Promise<HttpInfo< void>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to postData
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async postDataWithHttpInfo(response: ResponseContext): Promise<HttpInfo< void>> {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            return new HttpInfo(response.httpStatusCode, response.headers, response.body, undefined);
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}

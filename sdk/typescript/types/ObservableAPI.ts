import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions, mergeConfiguration } from '../configuration'
import type { Middleware } from '../middleware';
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
import { Batch } from '../models/Batch';
import { BatchResponse } from '../models/BatchResponse';
import { BatchResponseData } from '../models/BatchResponseData';
import { BatchStatus } from '../models/BatchStatus';
import { BatchUpdateData } from '../models/BatchUpdateData';
import { BatchUpdateDataData } from '../models/BatchUpdateDataData';
import { BatchUpdateDataDataAttributes } from '../models/BatchUpdateDataDataAttributes';
import { DataReference } from '../models/DataReference';
import { ErrorData } from '../models/ErrorData';
import { ErrorItem } from '../models/ErrorItem';
import { ErrorItemLinks } from '../models/ErrorItemLinks';
import { ErrorResponse } from '../models/ErrorResponse';
import { GetBatches200Response } from '../models/GetBatches200Response';
import { GetBatches200ResponseDataInner } from '../models/GetBatches200ResponseDataInner';
import { GetBatches200ResponseLinks } from '../models/GetBatches200ResponseLinks';
import { Letter } from '../models/Letter';
import { LetterStatus } from '../models/LetterStatus';
import { LetterStatusData } from '../models/LetterStatusData';
import { LetterStatusDataData } from '../models/LetterStatusDataData';
import { LetterStatusDataDataAttributes } from '../models/LetterStatusDataDataAttributes';
import { LetterUpdateData } from '../models/LetterUpdateData';
import { LetterUpdateDataData } from '../models/LetterUpdateDataData';
import { LetterUpdateDataDataAttributes } from '../models/LetterUpdateDataDataAttributes';
import { ProductionStatus } from '../models/ProductionStatus';

import { BatchApiRequestFactory, BatchApiResponseProcessor} from "../apis/BatchApi";
export class ObservableBatchApi {
    private requestFactory: BatchApiRequestFactory;
    private responseProcessor: BatchApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: BatchApiRequestFactory,
        responseProcessor?: BatchApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new BatchApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new BatchApiResponseProcessor();
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchIdWithHttpInfo(id: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<BatchResponse>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getBatchId(id, xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getBatchIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchId(id: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<BatchResponse> {
        return this.getBatchIdWithHttpInfo(id, xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<BatchResponse>) => apiResponse.data));
    }

    /**
     * Retrieve a list of available letter batches
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchesWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<GetBatches200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getBatches(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getBatchesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Retrieve a list of available letter batches
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatches(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<GetBatches200Response> {
        return this.getBatchesWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<GetBatches200Response>) => apiResponse.data));
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersBatchWithHttpInfo(id: string, xRequestID: string, body: BatchUpdateData, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<BatchUpdateData>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.patchLettersBatch(id, xRequestID, body, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.patchLettersBatchWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersBatch(id: string, xRequestID: string, body: BatchUpdateData, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<BatchUpdateData> {
        return this.patchLettersBatchWithHttpInfo(id, xRequestID, body, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<BatchUpdateData>) => apiResponse.data));
    }

}

import { DataApiRequestFactory, DataApiResponseProcessor} from "../apis/DataApi";
export class ObservableDataApi {
    private requestFactory: DataApiRequestFactory;
    private responseProcessor: DataApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DataApiRequestFactory,
        responseProcessor?: DataApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DataApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DataApiResponseProcessor();
    }

    /**
     * Fetch a data file
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getDataIdWithHttpInfo(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getDataId(id, id2, xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDataIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Fetch a data file
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.getDataIdWithHttpInfo(id, id2, xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Fetch data file metadata
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public headDataIdWithHttpInfo(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.headDataId(id, id2, xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.headDataIdWithHttpInfo(rsp)));
            }));
    }

    /**
     * Fetch data file metadata
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public headDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.headDataIdWithHttpInfo(id, id2, xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Request a URL to upload a new data file
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postDataWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.postData(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.postDataWithHttpInfo(rsp)));
            }));
    }

    /**
     * Request a URL to upload a new data file
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postData(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.postDataWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { LetterApiRequestFactory, LetterApiResponseProcessor} from "../apis/LetterApi";
export class ObservableLetterApi {
    private requestFactory: LetterApiRequestFactory;
    private responseProcessor: LetterApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: LetterApiRequestFactory,
        responseProcessor?: LetterApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new LetterApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new LetterApiResponseProcessor();
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param status Status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getAListOfLettersWithHttpInfo(status: LetterStatus, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getAListOfLetters(status, xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getAListOfLettersWithHttpInfo(rsp)));
            }));
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param status Status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getAListOfLetters(status: LetterStatus, xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.getAListOfLettersWithHttpInfo(status, xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getLetterStatusWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<LetterStatusData>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getLetterStatus(xRequestID, id, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getLetterStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getLetterStatus(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<LetterStatusData> {
        return this.getLetterStatusWithHttpInfo(xRequestID, id, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<LetterStatusData>) => apiResponse.data));
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersWithHttpInfo(xRequestID: string, id: string, body: LetterUpdateData, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<LetterStatusData>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.patchLetters(xRequestID, id, body, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.patchLettersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLetters(xRequestID: string, id: string, body: LetterUpdateData, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<LetterStatusData> {
        return this.patchLettersWithHttpInfo(xRequestID, id, body, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<LetterStatusData>) => apiResponse.data));
    }

    /**
     * Update the status of multiple letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postLetterWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.postLetter(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.postLetterWithHttpInfo(rsp)));
            }));
    }

    /**
     * Update the status of multiple letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postLetter(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.postLetterWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { MiApiRequestFactory, MiApiResponseProcessor} from "../apis/MiApi";
export class ObservableMiApi {
    private requestFactory: MiApiRequestFactory;
    private responseProcessor: MiApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: MiApiRequestFactory,
        responseProcessor?: MiApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new MiApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new MiApiResponseProcessor();
    }

    /**
     * Create a new MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createMiWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.createMi(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createMiWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a new MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createMi(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.createMiWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Fetch a specific MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getMiWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getMi(xRequestID, id, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMiWithHttpInfo(rsp)));
            }));
    }

    /**
     * Fetch a specific MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getMi(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.getMiWithHttpInfo(xRequestID, id, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * List MI records
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listMiWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listMi(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listMiWithHttpInfo(rsp)));
            }));
    }

    /**
     * List MI records
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listMi(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.listMiWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

import { WhitemailApiRequestFactory, WhitemailApiResponseProcessor} from "../apis/WhitemailApi";
export class ObservableWhitemailApi {
    private requestFactory: WhitemailApiRequestFactory;
    private responseProcessor: WhitemailApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: WhitemailApiRequestFactory,
        responseProcessor?: WhitemailApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new WhitemailApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new WhitemailApiResponseProcessor();
    }

    /**
     * Create a new whitemail letter batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createWhitemailWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.createWhitemail(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createWhitemailWithHttpInfo(rsp)));
            }));
    }

    /**
     * Create a new whitemail letter batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createWhitemail(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.createWhitemailWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getWhitemailWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getWhitemail(xRequestID, id, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getWhitemailWithHttpInfo(rsp)));
            }));
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getWhitemail(xRequestID: string, id: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.getWhitemailWithHttpInfo(xRequestID, id, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * List batches of whitemail letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listWhitemailWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listWhitemail(xRequestID, xCorrelationID, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listWhitemailWithHttpInfo(rsp)));
            }));
    }

    /**
     * List batches of whitemail letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listWhitemail(xRequestID: string, xCorrelationID?: string, _options?: ConfigurationOptions): Observable<void> {
        return this.listWhitemailWithHttpInfo(xRequestID, xCorrelationID, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

}

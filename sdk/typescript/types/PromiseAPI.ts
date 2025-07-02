import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, PromiseConfigurationOptions, wrapOptions } from '../configuration'
import { PromiseMiddleware, Middleware, PromiseMiddlewareWrapper } from '../middleware';

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
import { ObservableBatchApi } from './ObservableAPI';

import { BatchApiRequestFactory, BatchApiResponseProcessor} from "../apis/BatchApi";
export class PromiseBatchApi {
    private api: ObservableBatchApi

    public constructor(
        configuration: Configuration,
        requestFactory?: BatchApiRequestFactory,
        responseProcessor?: BatchApiResponseProcessor
    ) {
        this.api = new ObservableBatchApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchIdWithHttpInfo(id: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<BatchResponse>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getBatchIdWithHttpInfo(id, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchId(id: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<BatchResponse> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getBatchId(id, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Retrieve a list of available letter batches
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatchesWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<GetBatches200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getBatchesWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Retrieve a list of available letter batches
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getBatches(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<GetBatches200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getBatches(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersBatchWithHttpInfo(id: string, xRequestID: string, body: BatchUpdateData, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<BatchUpdateData>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.patchLettersBatchWithHttpInfo(id, xRequestID, body, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param id Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersBatch(id: string, xRequestID: string, body: BatchUpdateData, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<BatchUpdateData> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.patchLettersBatch(id, xRequestID, body, xCorrelationID, observableOptions);
        return result.toPromise();
    }


}



import { ObservableDataApi } from './ObservableAPI';

import { DataApiRequestFactory, DataApiResponseProcessor} from "../apis/DataApi";
export class PromiseDataApi {
    private api: ObservableDataApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DataApiRequestFactory,
        responseProcessor?: DataApiResponseProcessor
    ) {
        this.api = new ObservableDataApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Fetch a data file
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getDataIdWithHttpInfo(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getDataIdWithHttpInfo(id, id2, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch a data file
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getDataId(id, id2, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch data file metadata
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public headDataIdWithHttpInfo(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.headDataIdWithHttpInfo(id, id2, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch data file metadata
     * @param id
     * @param id2 Unique identifier of this resource
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public headDataId(id: string, id2: string, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.headDataId(id, id2, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Request a URL to upload a new data file
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postDataWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.postDataWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Request a URL to upload a new data file
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postData(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.postData(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }


}



import { ObservableLetterApi } from './ObservableAPI';

import { LetterApiRequestFactory, LetterApiResponseProcessor} from "../apis/LetterApi";
export class PromiseLetterApi {
    private api: ObservableLetterApi

    public constructor(
        configuration: Configuration,
        requestFactory?: LetterApiRequestFactory,
        responseProcessor?: LetterApiResponseProcessor
    ) {
        this.api = new ObservableLetterApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param status Status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getAListOfLettersWithHttpInfo(status: LetterStatus, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getAListOfLettersWithHttpInfo(status, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param status Status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getAListOfLetters(status: LetterStatus, xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getAListOfLetters(status, xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getLetterStatusWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<LetterStatusData>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLetterStatusWithHttpInfo(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getLetterStatus(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<LetterStatusData> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getLetterStatus(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLettersWithHttpInfo(xRequestID: string, id: string, body: LetterUpdateData, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<LetterStatusData>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.patchLettersWithHttpInfo(xRequestID, id, body, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param body
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public patchLetters(xRequestID: string, id: string, body: LetterUpdateData, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<LetterStatusData> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.patchLetters(xRequestID, id, body, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of multiple letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postLetterWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.postLetterWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Update the status of multiple letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public postLetter(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.postLetter(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }


}



import { ObservableMiApi } from './ObservableAPI';

import { MiApiRequestFactory, MiApiResponseProcessor} from "../apis/MiApi";
export class PromiseMiApi {
    private api: ObservableMiApi

    public constructor(
        configuration: Configuration,
        requestFactory?: MiApiRequestFactory,
        responseProcessor?: MiApiResponseProcessor
    ) {
        this.api = new ObservableMiApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a new MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createMiWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createMiWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Create a new MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createMi(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createMi(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch a specific MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getMiWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMiWithHttpInfo(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch a specific MI record
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getMi(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMi(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * List MI records
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listMiWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listMiWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * List MI records
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listMi(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listMi(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }


}



import { ObservableWhitemailApi } from './ObservableAPI';

import { WhitemailApiRequestFactory, WhitemailApiResponseProcessor} from "../apis/WhitemailApi";
export class PromiseWhitemailApi {
    private api: ObservableWhitemailApi

    public constructor(
        configuration: Configuration,
        requestFactory?: WhitemailApiRequestFactory,
        responseProcessor?: WhitemailApiResponseProcessor
    ) {
        this.api = new ObservableWhitemailApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a new whitemail letter batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createWhitemailWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createWhitemailWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Create a new whitemail letter batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public createWhitemail(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createWhitemail(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getWhitemailWithHttpInfo(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getWhitemailWithHttpInfo(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param id Unique identifier of this resource
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public getWhitemail(xRequestID: string, id: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getWhitemail(xRequestID, id, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * List batches of whitemail letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listWhitemailWithHttpInfo(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listWhitemailWithHttpInfo(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }

    /**
     * List batches of whitemail letters
     * @param xRequestID Unique request identifier, in the format of a GUID
     * @param [xCorrelationID] An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     */
    public listWhitemail(xRequestID: string, xCorrelationID?: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listWhitemail(xRequestID, xCorrelationID, observableOptions);
        return result.toPromise();
    }


}




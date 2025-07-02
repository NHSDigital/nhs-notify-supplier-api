import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';

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

import { ObservableBatchApi } from "./ObservableAPI";
import { BatchApiRequestFactory, BatchApiResponseProcessor} from "../apis/BatchApi";

export interface BatchApiGetBatchIdRequest {
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof BatchApigetBatchId
     */
    id: string
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof BatchApigetBatchId
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof BatchApigetBatchId
     */
    xCorrelationID?: string
}

export interface BatchApiGetBatchesRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof BatchApigetBatches
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof BatchApigetBatches
     */
    xCorrelationID?: string
}

export interface BatchApiPatchLettersBatchRequest {
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof BatchApipatchLettersBatch
     */
    id: string
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof BatchApipatchLettersBatch
     */
    xRequestID: string
    /**
     * 
     * @type BatchUpdateData
     * @memberof BatchApipatchLettersBatch
     */
    body: BatchUpdateData
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof BatchApipatchLettersBatch
     */
    xCorrelationID?: string
}

export class ObjectBatchApi {
    private api: ObservableBatchApi

    public constructor(configuration: Configuration, requestFactory?: BatchApiRequestFactory, responseProcessor?: BatchApiResponseProcessor) {
        this.api = new ObservableBatchApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param param the request object
     */
    public getBatchIdWithHttpInfo(param: BatchApiGetBatchIdRequest, options?: ConfigurationOptions): Promise<HttpInfo<BatchResponse>> {
        return this.api.getBatchIdWithHttpInfo(param.id, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Get details about a batch of letters
     * Retrieve a batch of letters
     * @param param the request object
     */
    public getBatchId(param: BatchApiGetBatchIdRequest, options?: ConfigurationOptions): Promise<BatchResponse> {
        return this.api.getBatchId(param.id, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Retrieve a list of available letter batches
     * @param param the request object
     */
    public getBatchesWithHttpInfo(param: BatchApiGetBatchesRequest, options?: ConfigurationOptions): Promise<HttpInfo<GetBatches200Response>> {
        return this.api.getBatchesWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Retrieve a list of available letter batches
     * @param param the request object
     */
    public getBatches(param: BatchApiGetBatchesRequest, options?: ConfigurationOptions): Promise<GetBatches200Response> {
        return this.api.getBatches(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param param the request object
     */
    public patchLettersBatchWithHttpInfo(param: BatchApiPatchLettersBatchRequest, options?: ConfigurationOptions): Promise<HttpInfo<BatchUpdateData>> {
        return this.api.patchLettersBatchWithHttpInfo(param.id, param.xRequestID, param.body, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of a batch of letters by providing the new status in the request body.
     * Update the status of a batch of letters
     * @param param the request object
     */
    public patchLettersBatch(param: BatchApiPatchLettersBatchRequest, options?: ConfigurationOptions): Promise<BatchUpdateData> {
        return this.api.patchLettersBatch(param.id, param.xRequestID, param.body, param.xCorrelationID,  options).toPromise();
    }

}

import { ObservableDataApi } from "./ObservableAPI";
import { DataApiRequestFactory, DataApiResponseProcessor} from "../apis/DataApi";

export interface DataApiGetDataIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DataApigetDataId
     */
    id: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof DataApigetDataId
     */
    id2: string
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof DataApigetDataId
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof DataApigetDataId
     */
    xCorrelationID?: string
}

export interface DataApiHeadDataIdRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof DataApiheadDataId
     */
    id: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof DataApiheadDataId
     */
    id2: string
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof DataApiheadDataId
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof DataApiheadDataId
     */
    xCorrelationID?: string
}

export interface DataApiPostDataRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof DataApipostData
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof DataApipostData
     */
    xCorrelationID?: string
}

export class ObjectDataApi {
    private api: ObservableDataApi

    public constructor(configuration: Configuration, requestFactory?: DataApiRequestFactory, responseProcessor?: DataApiResponseProcessor) {
        this.api = new ObservableDataApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Fetch a data file
     * @param param the request object
     */
    public getDataIdWithHttpInfo(param: DataApiGetDataIdRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.getDataIdWithHttpInfo(param.id, param.id2, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch a data file
     * @param param the request object
     */
    public getDataId(param: DataApiGetDataIdRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.getDataId(param.id, param.id2, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch data file metadata
     * @param param the request object
     */
    public headDataIdWithHttpInfo(param: DataApiHeadDataIdRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.headDataIdWithHttpInfo(param.id, param.id2, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch data file metadata
     * @param param the request object
     */
    public headDataId(param: DataApiHeadDataIdRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.headDataId(param.id, param.id2, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Request a URL to upload a new data file
     * @param param the request object
     */
    public postDataWithHttpInfo(param: DataApiPostDataRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.postDataWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Request a URL to upload a new data file
     * @param param the request object
     */
    public postData(param: DataApiPostDataRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.postData(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

}

import { ObservableLetterApi } from "./ObservableAPI";
import { LetterApiRequestFactory, LetterApiResponseProcessor} from "../apis/LetterApi";

export interface LetterApiGetAListOfLettersRequest {
    /**
     * Status of a letter
     * Defaults to: undefined
     * @type LetterStatus
     * @memberof LetterApigetAListOfLetters
     */
    status: LetterStatus
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof LetterApigetAListOfLetters
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof LetterApigetAListOfLetters
     */
    xCorrelationID?: string
}

export interface LetterApiGetLetterStatusRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof LetterApigetLetterStatus
     */
    xRequestID: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof LetterApigetLetterStatus
     */
    id: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof LetterApigetLetterStatus
     */
    xCorrelationID?: string
}

export interface LetterApiPatchLettersRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof LetterApipatchLetters
     */
    xRequestID: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof LetterApipatchLetters
     */
    id: string
    /**
     * 
     * @type LetterUpdateData
     * @memberof LetterApipatchLetters
     */
    body: LetterUpdateData
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof LetterApipatchLetters
     */
    xCorrelationID?: string
}

export interface LetterApiPostLetterRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof LetterApipostLetter
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof LetterApipostLetter
     */
    xCorrelationID?: string
}

export class ObjectLetterApi {
    private api: ObservableLetterApi

    public constructor(configuration: Configuration, requestFactory?: LetterApiRequestFactory, responseProcessor?: LetterApiResponseProcessor) {
        this.api = new ObservableLetterApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param param the request object
     */
    public getAListOfLettersWithHttpInfo(param: LetterApiGetAListOfLettersRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.getAListOfLettersWithHttpInfo(param.status, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * The key use of this endpoint is to query letters which have been cancelled using the `status=CANCELLED` query
     * Get a list of letters
     * @param param the request object
     */
    public getAListOfLetters(param: LetterApiGetAListOfLettersRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.getAListOfLetters(param.status, param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param param the request object
     */
    public getLetterStatusWithHttpInfo(param: LetterApiGetLetterStatusRequest, options?: ConfigurationOptions): Promise<HttpInfo<LetterStatusData>> {
        return this.api.getLetterStatusWithHttpInfo(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Get details the status of a letter.
     * Retrieve the status of a letter
     * @param param the request object
     */
    public getLetterStatus(param: LetterApiGetLetterStatusRequest, options?: ConfigurationOptions): Promise<LetterStatusData> {
        return this.api.getLetterStatus(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param param the request object
     */
    public patchLettersWithHttpInfo(param: LetterApiPatchLettersRequest, options?: ConfigurationOptions): Promise<HttpInfo<LetterStatusData>> {
        return this.api.patchLettersWithHttpInfo(param.xRequestID, param.id, param.body, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of a letter by providing the new status in the request body.
     * Update the status of a letter
     * @param param the request object
     */
    public patchLetters(param: LetterApiPatchLettersRequest, options?: ConfigurationOptions): Promise<LetterStatusData> {
        return this.api.patchLetters(param.xRequestID, param.id, param.body, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of multiple letters
     * @param param the request object
     */
    public postLetterWithHttpInfo(param: LetterApiPostLetterRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.postLetterWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Update the status of multiple letters
     * @param param the request object
     */
    public postLetter(param: LetterApiPostLetterRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.postLetter(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

}

import { ObservableMiApi } from "./ObservableAPI";
import { MiApiRequestFactory, MiApiResponseProcessor} from "../apis/MiApi";

export interface MiApiCreateMiRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof MiApicreateMi
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof MiApicreateMi
     */
    xCorrelationID?: string
}

export interface MiApiGetMiRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof MiApigetMi
     */
    xRequestID: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof MiApigetMi
     */
    id: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof MiApigetMi
     */
    xCorrelationID?: string
}

export interface MiApiListMiRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof MiApilistMi
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof MiApilistMi
     */
    xCorrelationID?: string
}

export class ObjectMiApi {
    private api: ObservableMiApi

    public constructor(configuration: Configuration, requestFactory?: MiApiRequestFactory, responseProcessor?: MiApiResponseProcessor) {
        this.api = new ObservableMiApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a new MI record
     * @param param the request object
     */
    public createMiWithHttpInfo(param: MiApiCreateMiRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.createMiWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Create a new MI record
     * @param param the request object
     */
    public createMi(param: MiApiCreateMiRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.createMi(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch a specific MI record
     * @param param the request object
     */
    public getMiWithHttpInfo(param: MiApiGetMiRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.getMiWithHttpInfo(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch a specific MI record
     * @param param the request object
     */
    public getMi(param: MiApiGetMiRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.getMi(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * List MI records
     * @param param the request object
     */
    public listMiWithHttpInfo(param: MiApiListMiRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.listMiWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * List MI records
     * @param param the request object
     */
    public listMi(param: MiApiListMiRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.listMi(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

}

import { ObservableWhitemailApi } from "./ObservableAPI";
import { WhitemailApiRequestFactory, WhitemailApiResponseProcessor} from "../apis/WhitemailApi";

export interface WhitemailApiCreateWhitemailRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApicreateWhitemail
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApicreateWhitemail
     */
    xCorrelationID?: string
}

export interface WhitemailApiGetWhitemailRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApigetWhitemail
     */
    xRequestID: string
    /**
     * Unique identifier of this resource
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApigetWhitemail
     */
    id: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApigetWhitemail
     */
    xCorrelationID?: string
}

export interface WhitemailApiListWhitemailRequest {
    /**
     * Unique request identifier, in the format of a GUID
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApilistWhitemail
     */
    xRequestID: string
    /**
     * An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding &#x60;.&#x60; characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header.
     * Defaults to: undefined
     * @type string
     * @memberof WhitemailApilistWhitemail
     */
    xCorrelationID?: string
}

export class ObjectWhitemailApi {
    private api: ObservableWhitemailApi

    public constructor(configuration: Configuration, requestFactory?: WhitemailApiRequestFactory, responseProcessor?: WhitemailApiResponseProcessor) {
        this.api = new ObservableWhitemailApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a new whitemail letter batch
     * @param param the request object
     */
    public createWhitemailWithHttpInfo(param: WhitemailApiCreateWhitemailRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.createWhitemailWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Create a new whitemail letter batch
     * @param param the request object
     */
    public createWhitemail(param: WhitemailApiCreateWhitemailRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.createWhitemail(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param param the request object
     */
    public getWhitemailWithHttpInfo(param: WhitemailApiGetWhitemailRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.getWhitemailWithHttpInfo(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * Fetch metadata about a specific whitemail batch
     * @param param the request object
     */
    public getWhitemail(param: WhitemailApiGetWhitemailRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.getWhitemail(param.xRequestID, param.id, param.xCorrelationID,  options).toPromise();
    }

    /**
     * List batches of whitemail letters
     * @param param the request object
     */
    public listWhitemailWithHttpInfo(param: WhitemailApiListWhitemailRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.listWhitemailWithHttpInfo(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

    /**
     * List batches of whitemail letters
     * @param param the request object
     */
    public listWhitemail(param: WhitemailApiListWhitemailRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.listWhitemail(param.xRequestID, param.xCorrelationID,  options).toPromise();
    }

}

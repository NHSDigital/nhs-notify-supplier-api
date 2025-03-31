/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Get a list of cancelled letters
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const cancellationGET = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a new artwork metadata record
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const createArtwork = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a new MI record
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const createMi = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a new proof metadata record
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const createProof = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a new returned letter batch
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const createReturn = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a new specification record
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const createSpecification = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch metadata about a specific artwork file
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getArtwork = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Retrieve a batch of letters
* Get details about a batch of letters
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns LettersResponse
* */
const getBatchId = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Retrieve a list of available letter batches
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getBatches = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch metadata about an existing data file
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getData = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Retrieve the status of a letter
* Get details the status of a letter.
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns LetterStatuData
* */
const getLetterStatus = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch a specific MI record
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getMi = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch metadata about a specific proof file
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getProof = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch metadata about a specific return batch
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getReturn = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Fetch metadata about a specific specification
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getSpecification = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update the status of multiple letters
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const letterPOST = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List artwork files
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const listArtwork = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List MI records
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const listMi = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List proof files
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const listProof = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List batches of returned letters
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const listReturn = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List specifications
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const listSpecification = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update metadata about a specific artwork file
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const patchArtwork = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update the status of a letter
* Update the status of a letter by providing the new status in the request body.
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* body LetterUpdateData
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns LetterUpdateData
* */
const patchLetters = ({ xRequestID, id, body, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        body,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update the status of a batch of letters
* Update the status of a batch of letters by providing the new status in the request body.
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* body LetterBatchUpdateData
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns LetterBatchUpdateData
* */
const patchLettersBatch = ({ xRequestID, id, body, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        body,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update metadata about a specific proof file
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const patchProof = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update metadata about a specific specification
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const patchSpecification = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        id,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Request a URL to upload a new data file
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const postData = ({ xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  cancellationGET,
  createArtwork,
  createMi,
  createProof,
  createReturn,
  createSpecification,
  getArtwork,
  getBatchId,
  getBatches,
  getData,
  getLetterStatus,
  getMi,
  getProof,
  getReturn,
  getSpecification,
  letterPOST,
  listArtwork,
  listMi,
  listProof,
  listReturn,
  listSpecification,
  patchArtwork,
  patchLetters,
  patchLettersBatch,
  patchProof,
  patchSpecification,
  postData,
};

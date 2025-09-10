/* eslint-disable no-unused-vars */
const fs = require('fs/promises');

const Service = require('./Service');
const ResponseProvider = require('../utils/ResponseProvider');

/**
* Retrieve the status of a letter
* Get details the status of a letter.
*
* xRequestID String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns getLetterStatus_200_response
* */
const getLetterStatus = ({ xRequestID, id, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      const fileData = await ResponseProvider.getLetterStatusResponse(id);
      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
        data: fileData,
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
* Get a list of PENDING letters
* The key use of this endpoint is to query letters which are ready to be printed
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* limit BigDecimal The maximum number of items to return in a single request (optional)
* returns listLetters_200_response
* */
const listLetters = ({ xRequestID, xCorrelationID, limit }) => new Promise(
  async (resolve, reject) => {
    try {
      const fileData = await ResponseProvider.getLettersResponse('PENDING', limit);

      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
        data: fileData,
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
* patchLettersRequest PatchLettersRequest
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns getLetterStatus_200_response
* */
const patchLetters = ({ xRequestID, id, patchLettersRequest, xCorrelationID }) => new Promise(
  async (resolve, reject) => {

    try {
      const fileData = await ResponseProvider.patchLettersResponse(patchLettersRequest);

      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
        data: fileData,
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
* postLettersRequest PostLettersRequest
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns listLetters_200_response
* */
const postLetters = ({ xRequestID, postLettersRequest, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        postLettersRequest,
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
  getLetterStatus,
  listLetters,
  patchLetters,
  postLetters,
};

/* eslint-disable no-unused-vars */
const fs = require('fs/promises');

const Service = require('./Service');
const ResponseProvider = require('../utils/ResponseProvider');

/**
* Retrieve the status of a letter
* Get details the status of a letter.
*
* xRequestId String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* xCorrelationId String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns getLetterStatus_200_response
* */
const getLetterStatus = ({ xRequestId, id, xCorrelationId }) => new Promise(
  async (resolve, reject) => {
    try {
      const responseData = await ResponseProvider.getLetterStatusResponse(id);
      const content = await fs.readFile(responseData.responsePath);

      const fileData = JSON.parse(content);
      resolve(Service.successResponse({
        xRequestId,
        xCorrelationId,
        data: fileData,
      }, responseData.responseCode));
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
* xRequestId String Unique request identifier, in the format of a GUID
* xCorrelationId String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* limit BigDecimal The maximum number of items to return in a single request (optional)
* returns listLetters_200_response
* */
const listLetters = ({ xRequestId, xCorrelationId, limit = 10 }) => new Promise(
  async (resolve, reject) => {
    try {
      const responseData = await ResponseProvider.getLettersResponse(limit);
      const content = await fs.readFile(responseData.responsePath);

      const fileData = JSON.parse(content);

      if (responseData.responseCode === 200)
      {
        fileData.data.splice(limit);
      }

      resolve(Service.successResponse({
        xRequestId,
        xCorrelationId,
        data: fileData,
      }, responseData.responseCode));
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
* xRequestId String Unique request identifier, in the format of a GUID
* id String Unique identifier of this resource
* patchLetterRequest PatchLetterRequest
* xCorrelationId String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns getLetterStatus_200_response
* */
const patchLetter = ({ xRequestId, id, body, xCorrelationId }) => new Promise(
  async (resolve, reject) => {
    try {
      const responseData = await ResponseProvider.patchLetterResponse(body);
      if (responseData.responseCode !== 202) {
        const content  = await fs.readFile(responseData.responsePath);
        const fileData = JSON.parse(content);

        resolve(Service.successResponse({
          xRequestId,
          xCorrelationId,
          data: fileData,
        }, responseData.responseCode));
      } else {
        resolve(Service.successResponse({
          xRequestId,
          xCorrelationId,
        }, responseData.responseCode));
      }
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
* xRequestId String Unique request identifier, in the format of a GUID
* postLettersRequest PostLettersRequest
* xCorrelationId String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns 202
* */
const postLetters = ({ xRequestId, body, xCorrelationId }) => new Promise(
  async (resolve, reject) => {
    const responseData = await ResponseProvider.postLettersResponse(body);

    try {
      if (responseData.responseCode !== 202) {
        const content  = await fs.readFile(responseData.responsePath);
        const fileData = JSON.parse(content);

        resolve(Service.successResponse({
          xRequestId,
          xCorrelationId,
          data: fileData,
        }, responseData.responseCode));
      } else {
        resolve(Service.successResponse({
          xRequestId,
          xCorrelationId,
        }, responseData.responseCode));
      }
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
  patchLetter,
  postLetters,
};

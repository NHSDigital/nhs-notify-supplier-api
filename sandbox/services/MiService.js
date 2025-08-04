/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Create a new MI record
*
* xRequestID String Unique request identifier, in the format of a GUID
* createMIRequest CreateMIRequest
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns listMi_200_response_data_inner
* */
const createMI = ({ xRequestID, createMIRequest, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        xRequestID,
        createMIRequest,
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
* returns getMi_200_response
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
* List MI Records
*
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns listMi_200_response
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

module.exports = {
  createMI,
  getMi,
  listMi,
};

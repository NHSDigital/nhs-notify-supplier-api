/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Fetch a data file
*
* id String Unique identifier of this resource
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const getDataId = ({ id, xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
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
* Check for the existance of a data file
*
* id String Unique identifier of this resource
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const headDataId = ({ id, xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
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
  getDataId,
  headDataId,
};

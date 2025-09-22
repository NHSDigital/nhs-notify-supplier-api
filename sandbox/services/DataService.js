/* eslint-disable no-unused-vars */
const fs = require('fs/promises');

const Service = require('./Service');
const ResponseProvider = require('../utils/ResponseProvider');


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
      const responseData = await ResponseProvider.getLetterDataResponse(id);
      if ((responseData.responseCode) >= 300 && (responseData.responseCode < 400))
      {
        resolve(Service.successResponse(null, responseData.responseCode, { Location: responseData.responsePath }));
      }else{
        const content = await fs.readFile(responseData.responsePath);
        const fileData = JSON.parse(content);
        resolve(Service.successResponse({
          xRequestID,
          xCorrelationID,
          data: fileData,
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
* Check for the existence of a data file
*
* id String Unique identifier of this resource
* xRequestID String Unique request identifier, in the format of a GUID
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* no response value expected for this operation
* */
const headDataId = ({ id, xRequestID, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      responseData = await ResponseProvider.getLetterDataResponse(id);
      if ((responseData.responseCode >= 300) && (responseData.responseCode < 400))
      {
        resolve(Service.successResponse(null, 200));
      }else{
        resolve(Service.successResponse(null, 404));
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
  getDataId,
  headDataId,
};

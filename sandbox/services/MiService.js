/* eslint-disable no-unused-vars */
const fs = require('fs/promises');
const Service = require('./Service');
const ResponseProvider = require('../utils/ResponseProvider');

/**
* Create a new MI record
*
* xRequestID String Unique request identifier, in the format of a GUID
* createMIRequest CreateMIRequest
* xCorrelationID String An optional ID which you can use to track transactions across multiple systems. It can take any value, but we recommend avoiding `.` characters. If not provided in the request, NHS Notify will default to a system generated ID in its place. The ID will be returned in a response header. (optional)
* returns createMI_201_response
* */
const createMI = ({ xRequestID, body, xCorrelationID }) => new Promise(
  async (resolve, reject) => {
    try {
      const responseData = await ResponseProvider.postMIResponse(body);
      const content  = await fs.readFile(responseData.responsePath);
      const fileData = JSON.parse(content);

      resolve(Service.successResponse({
        xRequestID,
        xCorrelationID,
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

module.exports = {
  createMI,
};

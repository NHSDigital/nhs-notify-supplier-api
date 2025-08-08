/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Health check endpoint
* Returns 200 OK if the service is up.
*
* no response value expected for this operation
* */
const getStatus = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
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
  getStatus,
};

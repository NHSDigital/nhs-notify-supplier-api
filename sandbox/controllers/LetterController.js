/**
 * The LetterController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/LetterService');
const getLetterStatus = async (request, response) => {
  await Controller.handleRequest(request, response, service.getLetterStatus);
};

const listLetters = async (request, response) => {
  await Controller.handleRequest(request, response, service.listLetters);
};

const patchLetter = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchLetter);
};

const postLetters = async (request, response) => {
  await Controller.handleRequest(request, response, service.postLetters);
};


module.exports = {
  getLetterStatus,
  listLetters,
  patchLetter,
  postLetters,
};

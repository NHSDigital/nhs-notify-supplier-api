/**
 * The DefaultController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/DefaultService');
const cancellationGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.cancellationGET);
};

const createArtwork = async (request, response) => {
  await Controller.handleRequest(request, response, service.createArtwork);
};

const createMi = async (request, response) => {
  await Controller.handleRequest(request, response, service.createMi);
};

const createProof = async (request, response) => {
  await Controller.handleRequest(request, response, service.createProof);
};

const createReturn = async (request, response) => {
  await Controller.handleRequest(request, response, service.createReturn);
};

const createSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.createSpecification);
};

const getArtwork = async (request, response) => {
  await Controller.handleRequest(request, response, service.getArtwork);
};

const getBatchId = async (request, response) => {
  await Controller.handleRequest(request, response, service.getBatchId);
};

const getBatches = async (request, response) => {
  await Controller.handleRequest(request, response, service.getBatches);
};

const getData = async (request, response) => {
  await Controller.handleRequest(request, response, service.getData);
};

const getLetterStatus = async (request, response) => {
  await Controller.handleRequest(request, response, service.getLetterStatus);
};

const getMi = async (request, response) => {
  await Controller.handleRequest(request, response, service.getMi);
};

const getProof = async (request, response) => {
  await Controller.handleRequest(request, response, service.getProof);
};

const getReturn = async (request, response) => {
  await Controller.handleRequest(request, response, service.getReturn);
};

const getSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.getSpecification);
};

const letterPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.letterPOST);
};

const listArtwork = async (request, response) => {
  await Controller.handleRequest(request, response, service.listArtwork);
};

const listMi = async (request, response) => {
  await Controller.handleRequest(request, response, service.listMi);
};

const listProof = async (request, response) => {
  await Controller.handleRequest(request, response, service.listProof);
};

const listReturn = async (request, response) => {
  await Controller.handleRequest(request, response, service.listReturn);
};

const listSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.listSpecification);
};

const patchArtwork = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchArtwork);
};

const patchLetters = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchLetters);
};

const patchLettersBatch = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchLettersBatch);
};

const patchProof = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchProof);
};

const patchSpecification = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchSpecification);
};

const postData = async (request, response) => {
  await Controller.handleRequest(request, response, service.postData);
};


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

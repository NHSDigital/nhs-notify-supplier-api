/* eslint-disable no-throw-literal */
const {Console} = require('console');
const e = require('express');
const fs = require('fs/promises');
const futil = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const lodash = require('lodash');


async function mapExampleResponse(requestBody, exampleResponseMap) {

  const entries = Object.entries(exampleResponseMap);

  // Read and compare all in parallel
  const checks = await Promise.all(
    entries.map(async ([requestBodyPath, response]) => {
      if (requestBodyPath)
      {
        try {
          const exampleRequestBody = JSON.parse(await fs.readFile(requestBodyPath));

          if (lodash.isEqual(requestBody, exampleRequestBody)) {
            return response; // match found
          }
        } catch (err) {
          console.error(`Failed to process ${requestBodyPath}:`, err);
          throw err;
        }
      }
      return null; // no match
    })
  );

  console.log('checks:', checks);
  // Find the first non-null result
  return checks.find(result => result !== null) ?? null;
}

function mapExampleGetResponse(parameterValue, exampleResponseMap) {
  const match = Object.entries(exampleResponseMap).find(([requestParameter, response]) => {
    try {
      return parameterValue === requestParameter;
    } catch (err) {
      console.error(`Failed to process ${parameterValue}:`, err);
      throw err;
    }
  });
  return match ? match[1] : null;
}

async function getLetterStatusResponse(id) {

  let filename = `data/examples/getLetter/responses/getLetter-${id}.json`
  let responseCode = 200;
  if (!futil.existsSync(filename))
  {
    filename = 'data/examples/errors/responses/resourceNotFound.json'
    responseCode = 404
  }

  return {responsePath: filename, responseCode: responseCode}

}


async function getLettersResponse(limit) {

  let status = 'SUCCESS';
  if (limit < 0 || limit > 2500)
  {
    status = 'INVALID_REQUEST';
  }

  const getLettersfileMap = {
    SUCCESS: {responsePath: 'data/examples/getLetters/responses/getLetters_pending.json', responseCode: 200},
    INVALID_REQUEST: {responsePath:'data/examples/errors/responses/getLetter/limitInvalidValue.json', responseCode: 400},
  };
  return mapExampleGetResponse(status, getLettersfileMap);
}

async function patchLettersResponse(request) {
  const patchLettersFileMap = {
    'data/examples/patchLetter/requests/patchLetter_DEFAULT.json': {responsePath: 'data/examples/patchLetter/responses/patchLetter_PENDING.json', responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_PENDING.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_PENDING.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_ACCEPTED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_ACCEPTED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_REJECTED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_REJECTED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_PRINTED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_PRINTED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_ENCLOSED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_ENCLOSED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_CANCELLED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_CANCELLED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_DISPATCHED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_DISPATCHED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_DELIVERED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_DELIVERED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_FAILED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_FAILED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_RETURNED.json': {responsePath:'data/examples/patchLetter/responses/patchLetter_RETURNED.json',responseCode: 200},
    'data/examples/patchLetter/requests/patchLetter_INVALID.json': {responsePath:'data/examples/errors/responses/badRequest.json',responseCode: 400},
    'data/examples/patchLetter/requests/patchLetter_NOTFOUND.json': {responsePath:'data/examples/errors/responses/resourceNotFound.json',responseCode: 404},
  };
  return await mapExampleResponse(request, patchLettersFileMap);
}

async function postLettersResponse(request) {
  const patchLettersFileMap = {
    'data/examples/postLetter/requests/postLetters.json': {responsePath: 'data/examples/postLetter/responses/postLetters.json', responseCode: 200},
  };
  return await mapExampleResponse(request, patchLettersFileMap);
}

async function postMIResponse(request) {
  const postMIFileMap = {
    'data/examples/createMI/requests/createMI_SUCCESS.json': {responsePath: 'data/examples/createMI/responses/createMI_SUCCESS.json', responseCode: 200},
    'data/examples/createMI/requests/createMI_INVALID.json': {responsePath:'data/examples/errors/responses/badRequest.json',responseCode: 400},
    'data/examples/createMI/requests/createMI_NOTFOUND.json': {responsePath:'data/examples/errors/responses/resourceNotFound.json',responseCode: 404},
  };
  return await mapExampleResponse(request, postMIFileMap);
}

async function getLetterDataResponse(id) {
  const getLetterDataFileMap = {
    '2AL5eYSWGzCHlGmzNxuqVusPxDg' : {responsePath: 'http://example.com', responseCode: 303},
    '2WL5eYSWGzCHlGmzNxuqVusPxDg' : {responsePath: 'data/examples/errors/responses/resourceNotFound.json', responseCode: 404},
  };
  return mapExampleGetResponse(id, getLetterDataFileMap);
}

module.exports = {
  getLetterStatusResponse,
  getLettersResponse,
  patchLettersResponse,
  postMIResponse,
  getLetterDataResponse
};

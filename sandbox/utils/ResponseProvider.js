/* eslint-disable no-throw-literal */
const {Console} = require('console');
const fs = require('fs/promises');
// eslint-disable-next-line import/no-extraneous-dependencies
const lodash = require('lodash');

function mapExampleResponse(requestBody, exampleResponseMap) {
  const match = Object.entries(exampleResponseMap).find(async ([requestBodyPath, response]) => {
    try {
      const requestBodyContent = await fs.readFile(requestBodyPath, 'utf8');
      const exampleRequestBody = JSON.parse(requestBodyContent);
      return lodash.isEqual(requestBody, exampleRequestBody);
    } catch (err) {
      console.error(`Failed to process ${requestBodyPath}:`, err);
      throw err;
    }
  });

  return match ? match[1] : null; // Return the matched response, or undefined if no match
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
  console.log(`GET /letters/${id}`)

  const filename = `data/examples/getLetter/responses/getLetter-${id}.json`
  if (!filename) {
    throw {message: `Not found: ${id}`, status: 404};
  }

  const content = await fs.readFile(filename, 'utf8');
  return JSON.parse(content);
}

async function getLettersResponse(status, limit) {
  const getLettersfileMap = {
    PENDING: 'data/examples/getLetters/responses/getLetters_pending.json',
  };

  const filename = mapExampleGetResponse(status, getLettersfileMap);
  if (!filename) {
    throw {message: `Not found: ${status}`, status: 404};
  }

  const content = await fs.readFile(filename, 'utf8');
  const response = JSON.parse(content);
  response.data.splice(limit);
  return response;
}

async function patchLettersResponse(request) {
  const patchLettersFileMap = {
    'data/examples/patchLetter/requests/patchLetter.json': 'data/examples/patchLetter/responses/patchLetter.json',
  };
  const filename = mapExampleResponse(request, patchLettersFileMap);
  if (!filename) {
    throw {message: 'Not found: ', status: 404};
  }

  const content = await fs.readFile(filename, 'utf8');
  return JSON.parse(content);
}

module.exports = {
  getLetterStatusResponse,
  getLettersResponse,
  patchLettersResponse
};

/* eslint-disable no-throw-literal */
const { Console } = require('console');
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
    try{
      return parameterValue === requestParameter;
    } catch (err) {
      console.error(`Failed to process ${parameterValue}:`, err);
      throw err;
    }
  });
  return match ? match[1] : null;
}


module.exports = {
  async getLettersResponse(status, page) {
    const getLettersfileMap = {
      PENDING: 'data/examples/getLetters/responses/getLetters_pending.json',
      PENDING1: 'data/examples/getLetters/responses/getLetters_pending.json',
      PENDING5: 'data/examples/getLetters/responses/getLetters_pending-5.json',
      PENDING10: 'data/examples/getLetters/responses/getLetters_pending-10.json',
      ACCEPTED: 'data/examples/getLetters/responses/getLetters_accepted.json',
    };

    const mapkey = page ? `${status}${page}` : status;
    const filename = mapExampleGetResponse(mapkey, getLettersfileMap);
    if (!filename) {
      throw { message: `Not found: ${status}`, status: 404 };
    }

    const content = await fs.readFile(filename, 'utf8');
    return JSON.parse(content);
  },

  async patchLettersResponse(request) {

    const patchLettersFileMap = {
      'data/examples/patchLetter/requests/patchLetter.json': 'data/examples/patchLetter/responses/patchLetter.json',
    };
    const filename = mapExampleResponse(request, patchLettersFileMap);
    if (!filename) {
      throw { message: 'Not found: ', status: 404 };
    }

    const content = await fs.readFile(filename, 'utf8');
    return JSON.parse(content);
  },
};

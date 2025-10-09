import * as handlers from "../index";
jest.mock('../config/lambda-config', () => ({
  lambdaConfig: {
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id'
  }
}));

it("exports", () => {
  expect(handlers.getLetters).toBeDefined();
  expect(handlers.patchLetter).toBeDefined();
  expect(handlers.getLetterData).toBeDefined();
});

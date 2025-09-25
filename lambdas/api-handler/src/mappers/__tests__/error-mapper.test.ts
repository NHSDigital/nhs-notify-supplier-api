import { mapErrorToResponse } from "../error-mapper";
import { ValidationError, NotFoundError } from "../../errors";
import { ApiErrorDetail } from "../../contracts/errors";

describe("mapErrorToResponse", () => {
  it("should map ValidationError to InvalidRequest response", () => {
    const err = new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);

    const res = mapErrorToResponse(err, 'correlationId');

    expect(res.statusCode).toEqual(400);
    expect(JSON.parse(res.body)).toEqual({
      "errors": [
        {
          "code": "NOTIFY_INVALID_REQUEST",
          "detail": "The letter ID in the request body does not match the letter ID path parameter",
          "id": "correlationId",
          "links": {
            "about": "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          "status": "400",
          "title": "Invalid request"
        }
      ]
    });
  });

  it("should map NotFoundError to NotFound response", () => {
    const err = new NotFoundError(ApiErrorDetail.NotFoundLetterId);

    const res = mapErrorToResponse(err, undefined);

    expect(res.statusCode).toEqual(404);
    expect(JSON.parse(res.body)).toEqual({
      "errors": [
        {
          "code": "NOTIFY_LETTER_NOT_FOUND",
          "detail": "No resource found with that ID",
          "id": expect.any(String),
          "links": {
            "about": "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          "status": "404",
          "title": "Not found"
        }
      ]
    });
  });

  it("should map generic Error to InternalServerError response", () => {
    const err = new Error("Something broke");

    const res = mapErrorToResponse(err, 'correlationId');

    expect(res.statusCode).toEqual(500);
    expect(JSON.parse(res.body)).toEqual({
      "errors": [
        {
          "code": "NOTIFY_INTERNAL_SERVER_ERROR",
          "detail": "Something broke",
          "id": "correlationId",
          "links": {
            "about": "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          "status": "500",
          "title": "Internal server error"
        }
      ]
    });
  });

  it("should map unexpected non-error to InternalServerError response", () => {
    const err = 12345; // not an Error

    const res = mapErrorToResponse(err, 'correlationId');

    expect(res.statusCode).toEqual(500);
    expect(JSON.parse(res.body)).toEqual({
      "errors": [
        {
          "code": "NOTIFY_INTERNAL_SERVER_ERROR",
          "detail": "Unexpected error",
          "id": "correlationId",
          "links": {
            "about": "https://digital.nhs.uk/developer/api-catalogue/nhs-notify-supplier"
          },
          "status": "500",
          "title": "Internal server error"
        }
      ]
    });
  });
});

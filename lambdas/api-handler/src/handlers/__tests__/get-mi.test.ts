import { Context } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import { MIRepository } from "@internal/datastore/src";
import { getMI as getMiOperation } from "../../services/mi-operations";
import { makeApiGwEvent } from "./utils/test-utils";
import { ApiErrorDetail } from "../../contracts/errors";
import NotFoundError from "../../errors/not-found-error";
import { Deps } from "../../config/deps";
import { EnvVars } from "../../config/env";
import createGetMIHandler from "../get-mi";

jest.mock("../../services/mi-operations");

describe("API Lambda handler", () => {
  const mockedDeps: jest.Mocked<Deps> = {
    miRepo: {} as unknown as MIRepository,
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      SUPPLIER_ID_HEADER: "nhsd-supplier-id",
      APIM_CORRELATION_HEADER: "nhsd-correlation-id",
      DOWNLOAD_URL_TTL_SECONDS: 1,
    } as unknown as EnvVars,
  } as Deps;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns 200 OK and the MI information", async () => {
    const mockedGetMiById = getMiOperation as jest.Mock;
    mockedGetMiById.mockResolvedValue({
      data: {
        id: "id1",
        type: "ManagementInformation",
        attributes: {
          lineItem: "envelope-business-standard",
          timestamp: "2023-11-17T14:27:51.413Z",
          quantity: 22,
          specificationId: "spec1",
          groupId: "group1",
          stockRemaining: 20_000,
        },
      },
    });

    const event = makeApiGwEvent({
      path: "/mi/id1",
      headers: {
        "nhsd-supplier-id": "supplier1",
        "nhsd-correlation-id": "correlationId",
        "x-request-id": "requestId",
      },
      pathParameters: { id: "id1" },
    });

    const getMi = createGetMIHandler(mockedDeps);
    const result = await getMi(event, mockDeep<Context>(), jest.fn());

    const expected = {
      data: {
        id: "id1",
        type: "ManagementInformation",
        attributes: {
          lineItem: "envelope-business-standard",
          timestamp: "2023-11-17T14:27:51.413Z",
          quantity: 22,
          specificationId: "spec1",
          groupId: "group1",
          stockRemaining: 20_000,
        },
      },
    };

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(expected, null, 2),
    });
  });

  it("returns 404 Not Found when MI matching id is not found", async () => {
    const mockedGetMiById = getMiOperation as jest.Mock;

    mockedGetMiById.mockImplementation(() => {
      throw new NotFoundError(ApiErrorDetail.NotFoundId);
    });

    const event = makeApiGwEvent({
      path: "/mi/id1",
      headers: {
        "nhsd-supplier-id": "supplier1",
        "nhsd-correlation-id": "correlationId",
        "x-request-id": "requestId",
      },
      pathParameters: { id: "id1" },
    });

    const getMi = createGetMIHandler(mockedDeps);
    const result = await getMi(event, mockDeep<Context>(), jest.fn());

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 404,
      }),
    );
  });

  it("returns 500 when correlation id is missing from header", async () => {
    const event = makeApiGwEvent({
      path: "/mi/id1",
      headers: { "nhsd-supplier-id": "supplier1", "x-request-id": "requestId" },
      pathParameters: { id: "id1" },
    });

    const getMi = createGetMIHandler(mockedDeps);
    const result = await getMi(event, mockDeep<Context>(), jest.fn());

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 500,
      }),
    );
  });

  it("returns 500 when supplier id is missing from header", async () => {
    const event = makeApiGwEvent({
      path: "/mi/id1",
      headers: {
        "nhsd-correlation-id": "correlationId",
        "x-request-id": "requestId",
      },
      pathParameters: { id: "id1" },
    });

    const getMi = createGetMIHandler(mockedDeps);
    const result = await getMi(event, mockDeep<Context>(), jest.fn());

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 500,
      }),
    );
  });

  it("returns 400 when letter id is missing from path", async () => {
    const event = makeApiGwEvent({
      path: "/mi/id1",
      headers: {
        "nhsd-supplier-id": "supplier1",
        "nhsd-correlation-id": "correlationId",
        "x-request-id": "requestId",
      },
    });

    const getMi = createGetMIHandler(mockedDeps);
    const result = await getMi(event, mockDeep<Context>(), jest.fn());

    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });
});

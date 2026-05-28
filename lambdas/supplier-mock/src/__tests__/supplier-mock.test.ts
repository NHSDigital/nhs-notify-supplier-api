import { InvokeCommand } from "@aws-sdk/client-lambda";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import createHandler from "../supplier-mock";
import { Deps } from "../deps";

function makeDeps(): Deps {
  return {
    env: {
      GET_LETTERS_FUNCTION_NAME: "get-letters-fn",
      PATCH_LETTER_FUNCTION_NAME: "patch-letter-fn",
      SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME:
        "/supapi/supplier-mock/get-letters-limit",
      SUPPLIER_MOCK_SUPPLIER_ID: "/supapi/supplier-mock/supplier-id",
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Deps["logger"],
    lambdaClient: {
      send: jest.fn(),
    } as unknown as Deps["lambdaClient"],
    ssmClient: {
      send: jest.fn(),
    } as unknown as Deps["ssmClient"],
  } as Deps;
}

describe("Supplier Mock Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invokes get letters and patch letter successfully", async () => {
    const deps = makeDeps();
    const ssmSend = jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "250" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    const lambdaSend = jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [{ id: "letter-1", attributes: { status: "PENDING" } }],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    expect(ssmSend).toHaveBeenCalledTimes(2);
    expect(lambdaSend).toHaveBeenCalledTimes(2);

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.headers["nhsd-supplier-id"]).toBe("SupplierA");
    expect(getLettersPayload.queryStringParameters.limit).toBe("250");

    const patchLetterCommand = lambdaSend.mock.calls[1][0] as InvokeCommand;
    const patchLetterPayload = JSON.parse(
      Buffer.from((patchLetterCommand as any).input.Payload).toString("utf8"),
    );

    expect(patchLetterPayload.pathParameters.id).toBe("letter-1");
    expect(JSON.parse(patchLetterPayload.body).data.attributes.status).toBe(
      "PENDING",
    );
  });

  it("throws when required env var is missing", async () => {
    const deps = makeDeps();
    deps.env.GET_LETTERS_FUNCTION_NAME = undefined;

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "GET_LETTERS_FUNCTION_NAME is not configured",
    );
  });

  it("throws when patch letter function env var is missing", async () => {
    const deps = makeDeps();
    deps.env.PATCH_LETTER_FUNCTION_NAME = undefined;

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "PATCH_LETTER_FUNCTION_NAME is not configured",
    );
  });

  it("throws when limit parameter env var is missing", async () => {
    const deps = makeDeps();
    deps.env.SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME = undefined;

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "SUPPLIER_MOCK_GET_LETTERS_LIMIT_PARAM_NAME is not configured",
    );
  });

  it("throws when supplier id parameter env var is missing", async () => {
    const deps = makeDeps();
    deps.env.SUPPLIER_MOCK_SUPPLIER_ID = undefined;

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "SUPPLIER_MOCK_SUPPLIER_ID is not configured",
    );
  });

  it("falls back to default limit and supplier id when parameter values are empty", async () => {
    const deps = makeDeps();
    const ssmSend = jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "1" } })
      .mockResolvedValueOnce({ Parameter: { Value: "" } });

    const lambdaSend = jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({ data: [] }),
          }),
        ),
      });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    expect(ssmSend).toHaveBeenCalledTimes(2);
    expect(lambdaSend).toHaveBeenCalledTimes(1);

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.headers["nhsd-supplier-id"]).toBe("TestSupplier1");
    expect(getLettersPayload.queryStringParameters.limit).toBe("100");
  });

  it("throws when reading limit parameter fails", async () => {
    const deps = makeDeps();
    const ssmError = new Error("SSM unavailable");
    jest.mocked(deps.ssmClient.send).mockRejectedValueOnce(ssmError);

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("SSM unavailable");
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("throws when reading supplier id parameter fails", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "250" } })
      .mockRejectedValueOnce(new Error("Supplier parameter not found"));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("Supplier parameter not found");
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("throws when invoking get letters fails", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest
      .mocked(deps.lambdaClient.send)
      .mockRejectedValueOnce(new Error("Invoke failed"));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("Invoke failed");
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("throws when get letters lambda returns function error", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest.mocked(deps.lambdaClient.send).mockResolvedValueOnce({
      FunctionError: "Unhandled",
      Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: "{}" })),
    });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when get letters lambda returns non-200 status", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest.mocked(deps.lambdaClient.send).mockResolvedValueOnce({
      Payload: Buffer.from(JSON.stringify({ statusCode: 500, body: "{}" })),
    });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when get letters lambda response has no payload", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest.mocked(deps.lambdaClient.send).mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when invoking patch letter fails", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [{ id: "letter-2", attributes: { status: "ACCEPTED" } }],
            }),
          }),
        ),
      })
      .mockRejectedValueOnce(new Error("Patch invoke failed"));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("Patch invoke failed");
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("throws when patch letter lambda returns function error", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [{ id: "letter-3", attributes: { status: "FAILED" } }],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({
        FunctionError: "Unhandled",
        Payload: Buffer.from(JSON.stringify({ errorMessage: "patch failed" })),
      });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "patch_letter lambda invocation failed for letter letter-3",
    );
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("throws when patch letter lambda returns function error without payload", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [{ id: "letter-4", attributes: { status: "FAILED" } }],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({
        FunctionError: "Unhandled",
      });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "patch_letter lambda invocation failed for letter letter-4",
    );
    expect(jest.mocked(deps.logger.error)).toHaveBeenCalled();
  });

  it("handles get letters response with no body by returning no letters", async () => {
    const deps = makeDeps();
    jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    const lambdaSend = jest
      .mocked(deps.lambdaClient.send)
      .mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify({ statusCode: 200 })),
      });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();
    expect(lambdaSend).toHaveBeenCalledTimes(1);
  });

  it("sends the expected parameter names to SSM", async () => {
    const deps = makeDeps();
    const ssmSend = jest
      .mocked(deps.ssmClient.send)
      .mockResolvedValueOnce({ Parameter: { Value: "200" } })
      .mockResolvedValueOnce({ Parameter: { Value: "SupplierA" } });

    jest.mocked(deps.lambdaClient.send).mockResolvedValueOnce({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ data: [] }),
        }),
      ),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const firstParamCommand = ssmSend.mock.calls[0][0] as GetParameterCommand;
    const secondParamCommand = ssmSend.mock.calls[1][0] as GetParameterCommand;

    expect((firstParamCommand as any).input.Name).toBe(
      "/supapi/supplier-mock/get-letters-limit",
    );
    expect((secondParamCommand as any).input.Name).toBe(
      "/supapi/supplier-mock/supplier-id",
    );
  });
});

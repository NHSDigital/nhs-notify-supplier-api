import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetParameterCommandOutput } from "@aws-sdk/client-ssm";
import pino from "pino";
import createHandler from "../handler/supplier-mock";
import { Deps } from "../handler/deps";

function configOutput(value?: string): GetParameterCommandOutput {
  if (value === undefined) {
    return { Parameter: {} } as GetParameterCommandOutput;
  }

  return {
    Parameter: {
      Value: value,
    },
  } as GetParameterCommandOutput;
}

function makeDeps(
  parameterStoreConfig: Promise<GetParameterCommandOutput>,
): Deps {
  return {
    env: {
      GET_LETTERS_FUNCTION_NAME: "get-letters-fn",
      PATCH_LETTER_FUNCTION_NAME: "patch-letter-fn",
      SUPPLIER_MOCK_CONFIG_PARAM_NAME: "/supapi/supplier-mock/config",
    },
    logger: { error: jest.fn(), info: jest.fn() } as unknown as pino.Logger,
    lambdaClient: {
      send: jest.fn(),
    } as unknown as jest.Mocket<LambdaClient>,
    parameterStoreConfig,
  };
}

function getLambdaSendMock(deps: Deps): jest.Mock {
  return deps.lambdaClient.send as unknown as jest.Mock;
}

function getLogErrorMock(deps: Deps): jest.Mock {
  return deps.logger.error as unknown as jest.Mock;
}

describe("Supplier Mock Lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invokes get letters and patch letter successfully", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput(
          '{"limit":"250","supplier_id":"SupplierA","specification_id_mapping":{}}',
        ),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps)
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
      "ACCEPTED",
    );
  });

  it("uses mapped status when specification id is present in config", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput(
          '{"limit":"250","supplier_id":"SupplierA","specification_id_mapping":{"spec-1":"FAILED"}}',
        ),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [
                {
                  id: "letter-1",
                  attributes: {
                    status: "PENDING",
                    specificationId: "spec-1",
                  },
                },
              ],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const patchLetterCommand = lambdaSend.mock.calls[1][0] as InvokeCommand;
    const patchLetterPayload = JSON.parse(
      Buffer.from((patchLetterCommand as any).input.Payload).toString("utf8"),
    );

    expect(JSON.parse(patchLetterPayload.body).data.attributes.status).toBe(
      "FAILED",
    );
  });

  it("falls back to ACCEPTED when mapped status is empty", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput(
          '{"limit":"250","supplier_id":"SupplierA","specification_id_mapping":{"spec-1":""}}',
        ),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [
                {
                  id: "letter-1",
                  attributes: {
                    status: "",
                    specificationId: "spec-1",
                  },
                },
              ],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const patchLetterCommand = lambdaSend.mock.calls[1][0] as InvokeCommand;
    const patchLetterPayload = JSON.parse(
      Buffer.from((patchLetterCommand as any).input.Payload).toString("utf8"),
    );

    expect(JSON.parse(patchLetterPayload.body).data.attributes.status).toBe(
      "ACCEPTED",
    );
  });

  it("ignores non-string mapping values and falls back", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput(
          '{"limit":"250","supplier_id":"SupplierA","specification_id_mapping":{"spec-1":123}}',
        ),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps)
      .mockResolvedValueOnce({
        Payload: Buffer.from(
          JSON.stringify({
            statusCode: 200,
            body: JSON.stringify({
              data: [
                {
                  id: "letter-1",
                  attributes: {
                    status: "PENDING",
                    specificationId: "spec-1",
                  },
                },
              ],
            }),
          }),
        ),
      })
      .mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const patchLetterCommand = lambdaSend.mock.calls[1][0] as InvokeCommand;
    const patchLetterPayload = JSON.parse(
      Buffer.from((patchLetterCommand as any).input.Payload).toString("utf8"),
    );

    expect(JSON.parse(patchLetterPayload.body).data.attributes.status).toBe(
      "ACCEPTED",
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

  it("throws when config parameter env var is missing", async () => {
    const deps = makeDeps();
    deps.env.SUPPLIER_MOCK_CONFIG_PARAM_NAME = undefined;

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "SUPPLIER_MOCK_CONFIG_PARAM_NAME is not configured",
    );
  });

  it("falls back to default limit and supplier id when config values are empty", async () => {
    const deps = makeDeps(
      Promise.resolve(configOutput('{"limit":"1","supplier_id":""}')),
    );

    const lambdaSend = getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ data: [] }),
        }),
      ),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    expect(lambdaSend).toHaveBeenCalledTimes(1);

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.headers["nhsd-supplier-id"]).toBe("TestSupplier1");
    expect(getLettersPayload.queryStringParameters.limit).toBe("100");
  });

  it("throws when reading supplier mock config fails", async () => {
    const deps = makeDeps(Promise.reject(new Error("SSM unavailable")));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("SSM unavailable");
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("throws when reading supplier mock config with invalid json", async () => {
    const deps = makeDeps(Promise.resolve(configOutput("not-json")));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow();
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("throws when invoking get letters fails", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps).mockRejectedValueOnce(new Error("Invoke failed"));

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow("Invoke failed");
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("throws when get letters lambda returns function error", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps).mockResolvedValueOnce({
      FunctionError: "Unhandled",
      Payload: Buffer.from(JSON.stringify({ statusCode: 200, body: "{}" })),
    });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when get letters lambda returns non-200 status", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(JSON.stringify({ statusCode: 500, body: "{}" })),
    });

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when get letters lambda response has no payload", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps).mockResolvedValueOnce({});

    const handler = createHandler(deps);
    await expect(handler()).rejects.toThrow(
      "get_letters lambda invocation failed",
    );
  });

  it("throws when invoking patch letter fails", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps)
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
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("throws when patch letter lambda returns function error", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps)
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
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("throws when patch letter lambda returns function error without payload", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    getLambdaSendMock(deps)
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
    expect(getLogErrorMock(deps)).toHaveBeenCalled();
  });

  it("handles get letters response with no body by returning no letters", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierA"}'),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(JSON.stringify({ statusCode: 200 })),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();
    expect(lambdaSend).toHaveBeenCalledTimes(1);
  });

  it("uses the provided parameter store config promise", async () => {
    const deps = makeDeps(
      Promise.resolve(
        configOutput('{"limit":"200","supplier_id":"SupplierB"}'),
      ),
    );

    const lambdaSend = getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ data: [] }),
        }),
      ),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.headers["nhsd-supplier-id"]).toBe("SupplierB");
  });

  it("falls back to default limit when limit is not a string", async () => {
    const deps = makeDeps(
      Promise.resolve(configOutput('{"limit":200,"supplier_id":"SupplierA"}')),
    );

    const lambdaSend = getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ data: [] }),
        }),
      ),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.queryStringParameters.limit).toBe("100");
  });

  it("falls back to defaults when config parameter value is missing", async () => {
    const deps = makeDeps(Promise.resolve(configOutput()));

    const lambdaSend = getLambdaSendMock(deps).mockResolvedValueOnce({
      Payload: Buffer.from(
        JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ data: [] }),
        }),
      ),
    });

    const handler = createHandler(deps);
    await expect(handler()).resolves.toBeUndefined();

    const getLettersCommand = lambdaSend.mock.calls[0][0] as InvokeCommand;
    const getLettersPayload = JSON.parse(
      Buffer.from((getLettersCommand as any).input.Payload).toString("utf8"),
    );

    expect(getLettersPayload.headers["nhsd-supplier-id"]).toBe("TestSupplier1");
    expect(getLettersPayload.queryStringParameters.limit).toBe("100");
  });
});

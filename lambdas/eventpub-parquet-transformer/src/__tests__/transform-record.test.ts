import { FirehoseTransformationEvent } from "aws-lambda";
import { Logger } from "pino";
import { handler } from "..";
import createHandler from "../handler";
import transformRecord from "../transform-record";

const encode = (value: unknown) =>
  Buffer.from(
    typeof value === "string" ? value : JSON.stringify(value),
    "utf8",
  ).toString("base64");

const decode = (data: string) =>
  JSON.parse(Buffer.from(data, "base64").toString("utf8"));

describe("transformRecord", () => {
  it("flattens the envelope, keeps data as JSON and promotes properties", () => {
    const data = {
      domainId: "d1",
      supplierId: "s1",
      groupId: "cl1-c1-t1",
      status: "PRINTED",
      specificationId: "spec1",
    };

    const out = transformRecord({
      recordId: "r1",
      data: encode({ id: "e1", type: "t", time: "now", data }),
    });

    expect(out.result).toBe("Ok");
    expect(out.recordId).toBe("r1");
    expect(Buffer.from(out.data!, "base64").toString().endsWith("\n")).toBe(
      true,
    );
    expect(decode(out.data!)).toEqual({
      id: "e1",
      type: "t",
      time: "now",
      data_json: JSON.stringify(data),
      domainid: "d1",
      supplierid: "s1",
      groupid: "cl1-c1-t1",
      campaignid: "c1",
      clientid: "cl1",
      status: "PRINTED",
      specificationid: "spec1",
    });
  });

  it.each([
    ["cl1-c1-t1", "cl1", "c1"],
    ["cl1-c1", "cl1", "c1"],
    ["cl1", "cl1", undefined],
    ["cl1--t1", "cl1", undefined],
    ["-c1-t1", undefined, "c1"],
    [" - ", undefined, undefined],
    ["", undefined, undefined],
    [undefined, undefined, undefined],
    [123, undefined, undefined],
  ])(
    "derives clientid and campaignid from groupId %p",
    (groupId, clientid, campaignid) => {
      const out = decode(
        transformRecord({
          recordId: "r",
          data: encode({ id: "e", data: { groupId } }),
        }).data!,
      );

      expect(out.clientid).toBe(clientid);
      expect(out.campaignid).toBe(campaignid);
    },
  );

  it("ignores clientId and campaignId properties on the data", () => {
    const out = decode(
      transformRecord({
        recordId: "r",
        data: encode({
          id: "e",
          data: { groupId: "cl1-c1-t1", clientId: "x", campaignId: "y" },
        }),
      }).data!,
    );

    expect(out.clientid).toBe("cl1");
    expect(out.campaignid).toBe("c1");
  });

  it("leaves promoted properties empty when data is missing or not an object", () => {
    const missing = decode(
      transformRecord({ recordId: "r", data: encode({ id: "e" }) }).data!,
    );
    const scalar = decode(
      transformRecord({ recordId: "r", data: encode({ id: "e", data: 1 }) })
        .data!,
    );

    expect(missing).toEqual({ id: "e", data_json: "null" });
    expect(scalar).toEqual({ id: "e", data_json: "1" });
  });

  it.each([["not json"], ["[1]"], ["null"]])(
    "returns ProcessingFailed for %s",
    (payload) => {
      const record = { recordId: "r", data: encode(payload) };

      expect(transformRecord(record)).toEqual({
        recordId: "r",
        result: "ProcessingFailed",
        data: record.data,
      });
    },
  );
});

describe("handler", () => {
  const event = {
    records: [
      { recordId: "1", data: encode({ id: "a" }) },
      { recordId: "2", data: encode("bad") },
    ],
  } as unknown as FirehoseTransformationEvent;

  it("transforms every record in the batch", async () => {
    const res = await handler(event, {} as never, () => {});

    expect(res!.records.map((r) => r.result)).toEqual([
      "Ok",
      "ProcessingFailed",
    ]);
  });

  it("logs failed records and a batch summary", async () => {
    const logger = { info: jest.fn(), warn: jest.fn() };
    const createdHandler = createHandler({
      logger: logger as unknown as Logger,
    });

    await createdHandler(event, {} as never, () => {});

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        logRef: "001-RECORD-FAILED",
        recordId: "2",
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        logRef: "002-BATCH-COMPLETE",
        recordCount: 2,
        failedCount: 1,
      }),
    );
  });
});

/**
 * Unit tests for s3-helpers.ts
 *
 * Mocks:
 * - @aws-sdk/client-s3: S3Client (with send) and PutObjectCommand
 * - node:fs.readFileSync to avoid touching the filesystem
 */

import * as s3Module from "@aws-sdk/client-s3";
import uploadFile from "../../helpers/s3-helpers";

jest.mock("@aws-sdk/client-s3", () => {
  const sendMock = jest.fn();
  class PutObjectCommand {
    input: any;

    constructor(input: any) {
      this.input = input;
    }
  }
  const S3Client = jest.fn().mockImplementation(() => ({ send: sendMock }));
  return {
    S3Client,
    PutObjectCommand,
    __sendMock: sendMock,
    __esModule: true,
  };
});

jest.mock("node:fs", () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from("fake-pdf-bytes")),
}));

describe("uploadFile", () => {
  const bucket = "my-bucket";
  const supplierId = "supplier-1";
  const sourceFilename = "some.pdf";
  const targetFilename = "target.pdf";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls S3Client.send with a PutObjectCommand containing correct params", async () => {
    const sendMock = (s3Module as any).__sendMock as jest.Mock;
    sendMock.mockResolvedValue({ ETag: '"etag-value"' });

    await expect(
      uploadFile(bucket, supplierId, sourceFilename, targetFilename),
    ).resolves.toBeDefined();

    // S3Client is a mocked constructor — grab the instance that was created
    const S3ClientMock = (s3Module as any).S3Client as jest.Mock;
    expect(S3ClientMock).toHaveBeenCalled();

    const instance = S3ClientMock.mock.results[0].value;
    expect(instance.send).toHaveBeenCalledTimes(1);

    const calledWith = instance.send.mock.calls[0][0];
    // The mocked PutObjectCommand stores input as `input` property
    expect(calledWith).toHaveProperty("input");
    expect(calledWith.input).toEqual({
      Bucket: bucket,
      Key: `${supplierId}/${targetFilename}`,
      Body: Buffer.from("fake-pdf-bytes"),
      ContentType: "application/pdf",
    });
  });

  it("logs and rethrows when S3Client.send rejects", async () => {
    const sendMock = (s3Module as any).__sendMock as jest.Mock;
    const err = new Error("upload-failed");
    sendMock.mockRejectedValueOnce(err);

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      uploadFile(bucket, supplierId, sourceFilename, targetFilename),
    ).rejects.toThrow("upload-failed");

    expect(consoleSpy).toHaveBeenCalledWith("Error uploading file:", err);

    consoleSpy.mockRestore();
  });
});

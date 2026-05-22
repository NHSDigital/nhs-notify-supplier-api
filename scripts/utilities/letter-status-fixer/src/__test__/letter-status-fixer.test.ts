import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "node:fs";

// Import after mocks
import { updateFailedLetters } from "../cli";

jest.mock("@aws-sdk/lib-dynamodb");
jest.mock("fs");

const mockSend = jest.fn();
const mockLog = { info: jest.fn(), error: jest.fn() };

jest.mock("../infrastructure/letters-repo-factory", () => ({
  createLetterDocClient: () => ({
    docClient: { send: mockSend },
    log: mockLog,
    config: {
      lettersTableName: "test-table",
      supplierStatusIndex: "test-index",
    },
  }),
}));

describe("updateFailedLetters", () => {
  const environment = "test-env";
  const supplierId = "SUP123";
  const status = "PENDING";
  // logFile and failuresFile are generated dynamically in the implementation, so we check for .log in assertions

  let fsMock: jest.Mocked<typeof fs>;
  beforeEach(() => {
    jest.clearAllMocks();
    fsMock = fs as jest.Mocked<typeof fs>;
    fsMock.appendFileSync.mockClear();
    fsMock.writeFileSync.mockClear();
  });

  it("updates all matching letters and logs IDs", async () => {
    mockSend
      .mockImplementationOnce(() => ({
        Items: [
          { letterId: "id1", groupId: "x".repeat(101) },
          { letterId: "id2", groupId: "y".repeat(102) },
        ],
        LastEvaluatedKey: undefined,
      }))
      .mockImplementation(() => ({})); // For UpdateCommand

    await updateFailedLetters(environment, supplierId, status);

    expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/updated-letters-\d+\.log/),
      expect.stringContaining("id1"),
      "utf8",
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/updated-letters-\d+\.log/),
      expect.stringContaining("id2"),
      "utf8",
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Updated 2 letters to FAILED"),
    );
  });

  it("logs failed updates to failures file", async () => {
    mockSend
      .mockImplementationOnce(() => ({
        Items: [{ letterId: "id3", groupId: "z".repeat(120) }],
        LastEvaluatedKey: undefined,
      }))
      .mockImplementationOnce(() => {
        throw new Error("fail");
      });

    await updateFailedLetters(environment, supplierId, status);

    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/failed-letters-\d+\.log/),
      expect.stringContaining("id3"),
      "utf8",
    );
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("Failed to update letter id3"),
    );
  });
});

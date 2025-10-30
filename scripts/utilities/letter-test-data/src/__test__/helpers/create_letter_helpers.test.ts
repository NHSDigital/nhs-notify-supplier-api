import { LetterRepository } from "@internal/datastore/src/letter-repository";
import { LetterStatusType } from "@internal/datastore";
import { createLetter, createLetterDto } from "../../helpers/create_letter_helpers";
import { uploadFile } from "../../helpers/s3_helpers";

jest.mock("../../helpers/s3_helpers");

describe("Create letter helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("create letter", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 1, 1));

    const mockPutLetter = jest.fn();
    const mockedLetterRepository = {
      putLetter: mockPutLetter,
    } as any as LetterRepository;
    const mockedUploadFile = uploadFile as jest.Mock;

    const supplierId = "supplierId";
    const letterId = "letterId";
    const bucketName = "bucketName";
    const targetFilename = "targetFilename";
    const groupId = "groupId";
    const specificationId = "specificationId";
    const status = "PENDING" as LetterStatusType;

    await createLetter({
      letterId,
      bucketName,
      supplierId,
      targetFilename,
      groupId,
      specificationId,
      status,
      letterRepository: mockedLetterRepository,
    });

    expect(mockedUploadFile).toHaveBeenCalledWith(
      "bucketName",
      "supplierId",
      "../../test_letter.pdf",
      "targetFilename",
    );
    expect(mockPutLetter).toHaveBeenCalledWith({
      createdAt: "2020-02-01T00:00:00.000Z",
      groupId: "groupId",
      id: "letterId",
      specificationId: "specificationId",
      status: "PENDING",
      supplierId: "supplierId",
      updatedAt: "2020-02-01T00:00:00.000Z",
      url: "s3://bucketName/supplierId/targetFilename",
    });
  });

  it("should create a letter DTO with correct fields", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 1, 1));

    const params = {
      letterId: "testLetterId",
      supplierId: "testSupplierId",
      specificationId: "testSpecId",
      groupId: "testGroupId",
      status: "PENDING" as LetterStatusType,
      url: "s3://bucket/testSupplierId/testLetter.pdf",
    };

    const result = createLetterDto(params);

    expect(result).toEqual({
      id: "testLetterId",
      supplierId: "testSupplierId",
      specificationId: "testSpecId",
      groupId: "testGroupId",
      url: "s3://bucket/testSupplierId/testLetter.pdf",
      status: "PENDING",
      createdAt: "2020-02-01T00:00:00.000Z",
      updatedAt: "2020-02-01T00:00:00.000Z",
    });
  });
});

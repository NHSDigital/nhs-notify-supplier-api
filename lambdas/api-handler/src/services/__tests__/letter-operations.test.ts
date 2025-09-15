import { Letter } from '../../../../../internal/datastore/src';
import { LetterApiResource, LetterApiStatus } from '../../contracts/letter-api';
import { getLettersForSupplier, patchLetterStatus } from '../letter-operations';

function makeLetterApiResource(id: string, status: LetterApiStatus) : LetterApiResource {
  return {
      attributes: {
        reasonCode: 123,
        reasonText: "Reason text",
        requestedProductionStatus: "ACTIVE",
        specificationId: "spec123",
        status
      },
      id,
      type: "Letter"
  };
}

function makeLetter(id: string, status: Letter['status']) : Letter {
  return {
      id,
      status,
      supplierId: 'supplier1',
      specificationId: 'spec123',
      groupId: 'group123',
      url: 'https://example.com/letter/abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: `supplier1#${status}`,
      supplierStatusSk: Date.now().toString(),
      ttl: 123
  };
}

describe("getLetterIdsForSupplier", () => {
  it("returns letter IDs from the repository", async () => {
    const mockRepo = {
      getLettersBySupplier: jest.fn().mockResolvedValue([
        { id: "id1", status: "PENDING", specificationId: "s1" },
        { id: "id2", status: "PENDING", specificationId: "s1" },
      ]),
    };

    const result = await getLettersForSupplier(
      "supplier1",
      "PENDING",
      10,
      mockRepo as any,
    );

    expect(mockRepo.getLettersBySupplier).toHaveBeenCalledWith(
      "supplier1",
      "PENDING",
      10,
    );
    expect(result).toEqual([
      { id: "id1", status: "PENDING", specificationId: "s1" },
      { id: "id2", status: "PENDING", specificationId: "s1" },
    ]);
  });
});

describe('patchLetterStatus function', () => {

  const letterResource = makeLetterApiResource("letter1", "ACCEPTED");

  const updatedLetter = makeLetter("letter1", "ACCEPTED");

  it('should update the letter status successfully', async () => {
    const mockRepo = {
      updateLetterStatus: jest.fn().mockResolvedValue(updatedLetter)
    };

    const result = await patchLetterStatus(letterResource, 'letter1', 'supplier1', mockRepo as any);

    expect(result).toEqual({ data: letterResource});
  });

  it('should throw validationError when letterIds differ', async () => {
    await expect(patchLetterStatus(letterResource, 'letter2', "supplier1", {} as any)).rejects.toThrow("The letter ID in the request body does not match the letter ID path parameter");
  });

  it('should throw notFoundError when letter does not exist', async () => {
    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('not found'))
    };

    await expect(patchLetterStatus(letterResource, 'letter1', 'supplier1', mockRepo as any)).rejects.toThrow("The provided letter ID does not exist");
  });

  it('should throw unexpected error', async () => {

    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('unexpected error'))
    };

    await expect(patchLetterStatus(letterResource, 'letter1', 'supplier1', mockRepo as any)).rejects.toThrow("unexpected error");
  });
});

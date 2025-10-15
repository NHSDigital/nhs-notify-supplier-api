import { Letter } from '@internal/datastore';
import { LetterDto, LetterStatus } from '../../contracts/letters';
import { getLettersForSupplier, patchLetterStatus } from '../letter-operations';


function makeLetter(id: string, status: Letter['status']): Letter {
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
    ttl: 123,
    reasonCode: 123,
    reasonText: "Reason text"
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

  const updatedLetterDto: LetterDto = {
    id: 'letter1',
    supplierId: 'supplier1',
    status: 'REJECTED',
    reasonCode: 123,
    reasonText: 'Reason text'
  };

  const updatedLetter = makeLetter("letter1", "REJECTED");

  it('should update the letter status successfully', async () => {
    const mockRepo = {
      updateLetterStatus: jest.fn().mockResolvedValue(updatedLetter)
    };

    const result = await patchLetterStatus(updatedLetterDto, 'letter1', mockRepo as any);

    expect(result).toEqual({
      data:
      {
        id: 'letter1',
        type: 'Letter',
        attributes: {
          status: 'REJECTED',
          reasonCode: updatedLetter.reasonCode,
          reasonText: updatedLetter.reasonText,
          specificationId: updatedLetter.specificationId,
          groupId: updatedLetter.groupId
        },
      }
    });
  });

  it('should throw validationError when letterIds differ', async () => {
    await expect(patchLetterStatus(updatedLetterDto, 'letter2', {} as any)).rejects.toThrow("The letter ID in the request body does not match the letter ID path parameter");
  });

  it('should throw notFoundError when letter does not exist', async () => {
    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('Letter with id l1 not found for supplier s1'))
    };

    await expect(patchLetterStatus(updatedLetterDto, 'letter1', mockRepo as any)).rejects.toThrow("No resource found with that ID");
  });

  it('should throw unexpected error', async () => {

    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('unexpected error'))
    };

    await expect(patchLetterStatus(updatedLetterDto, 'letter1', mockRepo as any)).rejects.toThrow("unexpected error");
  });
});

import { Letter, LetterStatus } from '../../../../../internal/datastore/src';
import { LetterApiResource, LetterApiStatus } from '../../contracts/letter-api';
import { getLetterIdsForSupplier, patchLetterStatus } from '../letter-operations';
import { z } from 'zod';

function makeLetterApiResource(id: string, status: LetterApiStatus) : LetterApiResource {
  return {
      attributes: {
        reasonCode: 123,
        reasonText: "Reason text",
        requestedProductionStatus: "ACTIVE",
        status
      },
      id,
      type: "Letter"
  };
}

function makeLetter(id: string, status: z.infer<typeof LetterStatus>) : Letter {
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
      ttl: 123
  };
}

describe('getLetterIdsForSupplier', () => {
  it('returns letter IDs from the repository', async () => {
    const mockRepo = {
      getLetterIdsBySupplier: jest.fn().mockResolvedValue(['id1', 'id2'])
    };

    const result = await getLetterIdsForSupplier('supplier1', mockRepo as any);

    expect(mockRepo.getLetterIdsBySupplier).toHaveBeenCalledWith('supplier1');
    expect(result).toEqual(['id1', 'id2']);
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
    await expect(patchLetterStatus(letterResource, 'letter2', "supplier1", {} as any)).rejects.toThrow("Bad Request: Letter ID in body does not match path parameter");
  });

  it('should throw notFoundError when letter does not exist', async () => {
    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('not found'))
    };

    await expect(patchLetterStatus(letterResource, 'letter1', 'supplier1', mockRepo as any)).rejects.toThrow("Not Found: Letter with ID letter1 does not exist");
  });

  it('should throw unexpected error', async () => {

    const mockRepo = {
      updateLetterStatus: jest.fn().mockRejectedValue(new Error('unexpected error'))
    };

    await expect(patchLetterStatus(letterResource, 'letter1', 'supplier1', mockRepo as any)).rejects.toThrow("unexpected error");
  });

});

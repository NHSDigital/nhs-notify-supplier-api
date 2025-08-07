import { getLetterIdsForSupplier } from '../get-letter-ids';

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

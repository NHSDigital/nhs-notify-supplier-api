import { toApiLetter } from '../letter-mapper';
import { Letter } from '../../../../../internal/datastore';
import { LetterApiDocument } from '../../contracts/letter-api';

describe('toApiLetter', () => {
  it('maps a Letter to LetterApiDocument', () => {
    const letter: Letter = {
      id: 'abc123',
      status: 'PENDING',
      supplierId: 'supplier1',
      specificationId: 'spec123',
      groupId: 'group123',
      url: 'https://example.com/letter/abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: 'supplier1#PENDING',
      ttl: 123
    };

    const result: LetterApiDocument = toApiLetter(letter);

    expect(result).toEqual({
      data: {
        id: 'abc123',
        type: 'Letter',
        attributes: {
          reasonCode: 123,
          reasonText: 'Reason text',
          requestedProductionStatus: 'ACTIVE',
          status: 'PENDING'
        }
      }
    });
  });
});

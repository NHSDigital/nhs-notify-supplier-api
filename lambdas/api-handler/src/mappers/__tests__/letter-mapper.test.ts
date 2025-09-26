import { mapLetterBaseToApiDocument, mapLetterBaseToApiResource } from '../letter-mapper';
import { Letter } from '../../../../../internal/datastore';
import { LetterApiDocument, LetterApiResource } from '../../contracts/letter-api';

describe('letter-mapper', () => {
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
      supplierStatusSk: Date.now().toString(),
      ttl: 123
    };

    const result: LetterApiDocument = mapLetterBaseToApiDocument(letter);

    expect(result).toEqual({
      data: {
        id: 'abc123',
        type: 'Letter',
        attributes: {
          specificationId: 'spec123',
          status: 'PENDING',
          groupId: 'group123'
        }
      }
    });
  });

  it('maps a Letter to LetterApiDocument with reasonCode and reasonText when present', () => {
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
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: 123,
      reasonText: 'Reason text'
    };

    const result: LetterApiDocument = mapLetterBaseToApiDocument(letter, {excludeOptional:false});

    expect(result).toEqual({
      data: {
        id: 'abc123',
        type: 'Letter',
        attributes: {
          specificationId: 'spec123',
          status: 'PENDING',
          groupId: 'group123',
          reasonCode: 123,
          reasonText: 'Reason text',
        }
      }
    });
  });

  it('maps a Letter to LetterApiDocument without reasonCode and reasonText when present', () => {
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
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: 123,
      reasonText: 'Reason text'
    };

    const result: LetterApiDocument = mapLetterBaseToApiDocument(letter, {excludeOptional: true});

    expect(result).toEqual({
      data: {
        id: 'abc123',
        type: 'Letter',
        attributes: {
          specificationId: 'spec123',
          status: 'PENDING',
          groupId: 'group123'
        }
      }
    });
  });


  it('maps a Letter to LetterApiResource with reasonCode and reasonText when present', () => {
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
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: 123,
      reasonText: 'Reason text'
    };

    const result: LetterApiResource = mapLetterBaseToApiResource(letter);

    expect(result).toEqual({
      id: 'abc123',
      type: 'Letter',
      attributes: {
        specificationId: 'spec123',
        status: 'PENDING',
        groupId: 'group123',
        reasonCode: 123,
        reasonText: 'Reason text'
      }
    });
  });
});

import { Letter, LetterRepository } from '@internal/datastore';
import { Deps } from '../../config/deps';
import { LetterDto, PostLettersRequest } from '../../contracts/letters';
import { enqueueLetterUpdateRequests, getLetterById, getLetterDataUrl, getLettersForSupplier, patchLetterStatus } from '../letter-operations';
import pino from 'pino';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

describe("getLetterIdsForSupplier", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

describe("getLetterById", () => {

  const testLetter = { id: "id1", status: "PENDING", specificationId: "s1",  groupId: "g1", };

  it("returns letter from the repository", async () => {

    const mockRepo = {
      getLetterById: jest.fn().mockResolvedValue(testLetter),
    };

    const result = await getLetterById(
      "supplier1",
      "id1",
      mockRepo as any,
    );

    expect(mockRepo.getLetterById).toHaveBeenCalledWith(
      "supplier1",
      "id1",
    );
    expect(result).toEqual({ id: 'id1', status: 'PENDING', specificationId: 's1',  groupId: 'g1' });
  });

    it('should throw notFoundError when letter does not exist', async () => {
    const mockRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error('Letter with id l1 not found for supplier s1'))
    };

    await expect(getLetterById('supplierid', 'letter1', mockRepo as any)).rejects.toThrow('No resource found with that ID');
  });

    it('should throw unexpected error', async () => {

    const mockRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error('unexpected error'))
    };

    await expect(getLetterById('supplierid', 'letter1', mockRepo as any)).rejects.toThrow("unexpected error");
  });

});

describe('patchLetterStatus function', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

describe('getLetterDataUrl function', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;
  const MockedGetObjectCommand = GetObjectCommand as unknown as jest.Mock;

  const updatedLetter = makeLetter("letter1", "REJECTED");

  const s3Client = { send: jest.fn() } as unknown as S3Client;
  const letterRepo = {
    getLetterById: jest.fn().mockResolvedValue(updatedLetter)
  } as unknown as LetterRepository;
  const logger = jest.fn() as unknown as pino.Logger;;
  const env = {
        LETTERS_TABLE_NAME: 'LettersTable',
        LETTER_TTL_HOURS: 12960,
        SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
        APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
        DOWNLOAD_URL_TTL_SECONDS: 60
  };
  const deps: Deps = { s3Client, letterRepo, logger, env } as Deps;

  it('should return pre signed url successfully', async () => {

    mockedGetSignedUrl.mockResolvedValue('http://somePreSignedUrl.com');

    const result = await getLetterDataUrl('supplier1', 'letter1', deps);

    const expectedCommandInput = {
        Bucket: 'letterDataBucket',
        Key: 'letter1.pdf'
    };
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(s3Client, { input: expectedCommandInput}, { expiresIn: 60});
    expect(result).toEqual('http://somePreSignedUrl.com');
  });

  it('should throw notFoundError when letter does not exist', async () => {
    deps.letterRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error('Letter with id l1 not found for supplier s1'))
    } as unknown as LetterRepository;

    await expect(getLetterDataUrl('supplier1', 'letter42', deps)).rejects.toThrow("No resource found with that ID");
  });

  it('should throw unexpected error', async () => {

    deps.letterRepo = {
      getLetterById: jest.fn().mockRejectedValue(new Error('unexpected error'))
    } as unknown as LetterRepository;

    await expect(getLetterDataUrl('supplier1', 'letter1', deps)).rejects.toThrow("unexpected error");
  });
});

function makeLetter(id: string, status: Letter['status']) : Letter {
  return {
      id,
      status,
      supplierId: 'supplier1',
      specificationId: 'spec123',
      groupId: 'group123',
      url: `s3://letterDataBucket/${id}.pdf`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplierStatus: `supplier1#${status}`,
      supplierStatusSk: Date.now().toString(),
      ttl: 123,
      reasonCode: 123,
      reasonText: "Reason text"
  };
}

describe('enqueueLetterUpdateRequests function', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the letter status successfully', async () => {

    const updateLettersRequest : PostLettersRequest = {
      data: [
        {
          id: 'id1',
          type: 'Letter',
          attributes: {
            status: 'REJECTED',
            reasonCode: 123,
            reasonText: 'Reason text',
          }
        },
        {
          id: 'id2',
          type: 'Letter',
          attributes: {
            status: 'ACCEPTED'
          }
        }
      ]
    };
    const sqsClient = { send: jest.fn() } as unknown as SQSClient;
    const logger = { error: jest.fn() } as unknown as pino.Logger;
    const env = {
      QUEUE_URL: 'sqsUrl'
    };
    const deps: Deps = { sqsClient, logger, env } as Deps;

    const result = await enqueueLetterUpdateRequests(updateLettersRequest, 'supplier1', 'correlationId1', deps);

    expect(deps.sqsClient.send).toHaveBeenNthCalledWith(1, expect.objectContaining({
      input: {
        QueueUrl: deps.env.QUEUE_URL,
        MessageAttributes: {
          CorrelationId: {
            DataType: 'String',
            StringValue: 'correlationId1',
          }
        },
        MessageBody: JSON.stringify({
            id: updateLettersRequest.data[0].id,
            supplierId: 'supplier1',
            status: updateLettersRequest.data[0].attributes.status,
            reasonCode: updateLettersRequest.data[0].attributes.reasonCode,
            reasonText: updateLettersRequest.data[0].attributes.reasonText
        })
      }
    }));

    expect(deps.sqsClient.send).toHaveBeenNthCalledWith(2, expect.objectContaining({
      input: {
        QueueUrl: deps.env.QUEUE_URL,
        MessageAttributes: {
          CorrelationId: {
            DataType: 'String',
            StringValue: 'correlationId1',
          }
        },
        MessageBody: JSON.stringify({
            id: updateLettersRequest.data[1].id,
            supplierId: 'supplier1',
            status: updateLettersRequest.data[1].attributes.status
        })
      }
    }));
  });

  it('should log error if enqueueing fails', async () => {

    const mockError = new Error('error');

    const updateLettersRequest : PostLettersRequest = {
      data: [
        {
          id: 'id1',
          type: 'Letter',
          attributes: {
            status: 'REJECTED',
            reasonCode: 123,
            reasonText: 'Reason text',
          }
        }
      ]
    };
    const sqsClient = { send: jest.fn().mockRejectedValue(mockError) } as unknown as SQSClient;
    const logger = { error: jest.fn() } as unknown as pino.Logger;
    const env = {
      QUEUE_URL: 'sqsUrl'
    };
    const deps: Deps = { sqsClient, logger, env } as Deps;

    const result = await enqueueLetterUpdateRequests(updateLettersRequest, 'supplier1', 'correlationId1', deps);

    expect(deps.logger.error).toHaveBeenCalledWith({ err: mockError},
          'Error queuing letterId=id1 supplierId=supplier1 correlationId=correlationId1 for update');
  });
});

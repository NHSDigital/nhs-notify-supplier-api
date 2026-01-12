import {
  Letter,
  LetterRepository,
  LetterStatusType,
} from "@internal/datastore";
import { uploadFile } from "./s3_helpers";

export async function createLetter(params: {
  letterId: string;
  bucketName: string;
  supplierId: string;
  targetFilename: string;
  specificationId: string;
  groupId: string;
  status: LetterStatusType;
  letterRepository: LetterRepository;
}) {
  const {
    bucketName,
    groupId,
    letterId,
    letterRepository,
    specificationId,
    status,
    supplierId,
    targetFilename,
  } = params;

  await uploadFile(
    bucketName,
    supplierId,
    "../../test_letter.pdf",
    targetFilename,
  );

  const letter: Omit<Letter, "ttl" | "supplierStatus" | "supplierStatusSk"> = {
    id: letterId,
    supplierId,
    specificationId,
    groupId,
    url: `s3://${bucketName}/${supplierId}/${targetFilename}`,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "/data-plane/letter-rendering/letter-test-data",
    subject: `supplier-api/letter-test-data/${letterId}`,
    billingRef: specificationId,
  };

  const letterRecord = await letterRepository.putLetter(letter);
  console.log(letterRecord);
}

export function createLetterDto(params: {
  letterId: string;
  supplierId: string;
  specificationId: string;
  groupId: string;
  status: LetterStatusType;
  url: string;
}) {
  const { groupId, letterId, specificationId, status, supplierId, url } =
    params;

  const letter: Omit<Letter, "ttl" | "supplierStatus" | "supplierStatusSk"> = {
    id: letterId,
    supplierId,
    specificationId,
    groupId,
    url,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "/data-plane/letter-rendering/letter-test-data",
    subject: `supplier-api/letter-test-data/${letterId}`,
    billingRef: specificationId,
  };

  return letter;
}

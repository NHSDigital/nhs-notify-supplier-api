import {
  LetterRepository,
  Letter,
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
    letterId,
    bucketName,
    supplierId,
    targetFilename,
    specificationId,
    groupId,
    status,
    letterRepository,
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
    status: status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  const {
    letterId,
    supplierId,
    specificationId,
    groupId,
    status,
    url,
  } = params;

  const letter: Omit<Letter, "ttl" | "supplierStatus" | "supplierStatusSk"> = {
    id: letterId,
    supplierId,
    specificationId,
    groupId,
    url: url,
    status: status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return letter;
}

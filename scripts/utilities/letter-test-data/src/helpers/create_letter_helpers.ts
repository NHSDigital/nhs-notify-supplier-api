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
  testLetter: string;
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
    specificationId,
    groupId,
    status,
    letterRepository,
    testLetter,
  } = params;

  if (testLetter !== "none") {
    await uploadFile(
      bucketName,
      supplierId,
      `${testLetter}.pdf`,
      targetFilename,
    );
  }

  const letter: Omit<Letter, "ttl" | "supplierStatus" | "supplierStatusSk"> = {
    id: letterId,
    supplierId,
    specificationId,
    groupId,
    url: `s3://${bucketName}/${supplierId}/${targetFilename}`,
    status,
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
  };

  return letter;
}

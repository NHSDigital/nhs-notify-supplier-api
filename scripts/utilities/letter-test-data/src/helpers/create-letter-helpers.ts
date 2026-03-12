import {
  Letter,
  LetterRepository,
  LetterStatusType,
} from "@internal/datastore";
import uploadFile from "./s3-helpers";

export async function createLetter(params: {
  letterId: string;
  bucketName: string;
  supplierId: string;
  targetFilename: string;
  specificationId: string;
  billingId: string;
  groupId: string;
  status: LetterStatusType;
  letterRepository: LetterRepository;
  testLetter: string;
}) {
  const {
    billingId,
    bucketName,
    groupId,
    letterId,
    letterRepository,
    specificationId,
    status,
    supplierId,
    targetFilename,
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
    source: "/data-plane/letter-rendering/letter-test-data",
    subject: `supplier-api/letter-test-data/${letterId}`,
    billingRef: specificationId,
    specificationBillingId: billingId,
  };

  const letterRecord = await letterRepository.putLetter(letter);
  console.log(letterRecord);
}

export function createLetterDto(params: {
  letterId: string;
  supplierId: string;
  specificationId: string;
  billingId: string;
  groupId: string;
  status: LetterStatusType;
  url: string;
}) {
  const {
    billingId,
    groupId,
    letterId,
    specificationId,
    status,
    supplierId,
    url,
  } = params;

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
    specificationBillingId: billingId,
  };

  return letter;
}

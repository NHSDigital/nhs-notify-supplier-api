import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import path from "node:path";

export default async function uploadFile(
  bucketName: string,
  folder: string,
  sourceFilename: string,
  targetFilename: string,
) {
  try {
    const s3 = new S3Client();
    const filePath = path.join(__dirname, '..', 'test-letters', sourceFilename);
    const fileContent = readFileSync(filePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: `${folder}/${targetFilename}`,
      Body: fileContent,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(uploadParams);
    return await s3.send(command);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

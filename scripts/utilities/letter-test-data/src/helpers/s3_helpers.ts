import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import path from "node:path";

export async function uploadFile(
  bucketName: string,
  supplierId: string,
  sourceFilename: string,
  targetFilename: string,
) {
  try {
    const s3 = new S3Client();
    const filePath = path.join(__dirname, sourceFilename);
    const fileContent = readFileSync(filePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: `${supplierId}/${targetFilename}`,
      Body: fileContent,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(uploadParams);
    return await s3.send(command);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

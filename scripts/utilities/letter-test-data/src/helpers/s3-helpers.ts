import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
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
    const filePath = path.join(__dirname, "..", "test-letters", sourceFilename);
    const fileContent = readFileSync(filePath);
    const hash = createHash("sha256").update(fileContent).digest("hex");

    const uploadParams = {
      Bucket: bucketName,
      Key: `${folder}/${targetFilename}`,
      Body: fileContent,
      ContentType: "application/pdf",
      Metadata: {
        sha256Hash: hash,
      },
    };

    const command = new PutObjectCommand(uploadParams);
    const commandResult = await s3.send(command);
    return {commandResult, hash};
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

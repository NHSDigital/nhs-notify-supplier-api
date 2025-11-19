import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import path from "path";


export async function uploadFile(bucketName: string, supplierId: string, sourceFilename: string, targetFilename: string) {
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
  } catch (err) {
    console.error("Error uploading file:", err);
  }
}

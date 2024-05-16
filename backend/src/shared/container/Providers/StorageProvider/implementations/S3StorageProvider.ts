import AWS, { S3 } from "aws-sdk";
import fs from "fs";
import path, { resolve } from "path";
import { IStorageProvider } from "../IStorageProvider";
import upload from "../../../../../config/upload";

class S3StorageProvider implements IStorageProvider {
  private client: S3;

  constructor() {
    this.client = new AWS.S3({
      region: process.env.S3_BUCKET_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    });
  }

  async save(file: string, folder: string): Promise<string> {
    const originalName = resolve(upload.directory, file);

    const fileContent = await fs.promises.readFile(originalName);
  
    const ext = path.extname(originalName);
    // const ContentType = mime.getType(originalName);
    const ContentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
    }[ext.toLowerCase()];

    await this.client.putObject({
      Bucket: `${process.env.S3_BUCKET}/${folder}`,
      Key: file,
      ACL: "public-read",
      Body: fileContent,
      ContentType
    }).promise();

    await fs.promises.unlink(originalName);

    return file;
  }

  async delete(file: string, folder: string): Promise<void> {
    await this.client.deleteObject({
      Bucket: `${process.env.S3_BUCKET}/${folder}`,
      Key: file,
    }).promise();
  }

}

export { S3StorageProvider };
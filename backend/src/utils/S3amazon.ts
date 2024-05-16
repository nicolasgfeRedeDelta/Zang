import AWS from 'aws-sdk';

interface FileResponse {
  media: Buffer;
  mimetype: string;
}

type S3Params = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

const credentials: S3Params = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_DEFAULT_REGION,
};

const createS3 = () => {
  const s3 = new AWS.S3(credentials);

  const uploadFile = async (
    bucketName: string,
    fileKey: string,
    fileContent: Buffer,
    ticketId: string,
    companyId: number,
  ): Promise<AWS.S3.PutObjectOutput> => {
    const params = {
      Bucket: bucketName,
      Key: `imagens/${companyId}/${ticketId}/${fileKey}`,
      Body: fileContent,
    };

    return s3.putObject(params).promise();
  };

  const uploadFileCampaign = async (
    bucketName: string,
    fileKey: string,
    fileContent: Buffer,
    companyId: number,
  ): Promise<AWS.S3.PutObjectOutput> => {
    const params = {
      Bucket: bucketName,
      Key: `imagens/${companyId}/Campaigns/${fileKey}`,
      Body: fileContent,
    };

    return s3.putObject(params).promise();
  };

  const uploadFileAPI = async (
    bucketName: string,
    fileKey: string,
    fileContent: Buffer,
    companyId: number,
  ): Promise<AWS.S3.PutObjectOutput> => {
    const params = {
      Bucket: bucketName,
      Key: `imagens/${companyId}/api/${fileKey}`,
      Body: fileContent,
    };

    return s3.putObject(params).promise();
  };

  const getFile = async (bucketName: string, location: string): Promise<FileResponse> => {
    try {
      const params = {
        Bucket: bucketName,
        Key: location,
      };

      const response = await s3.getObject(params).promise();

      return { media: response.Body, mimetype: response.ContentType } as FileResponse;
    } catch (err) {
      console.log(err);
    }
  };

  return {
    uploadFile,
    uploadFileCampaign,
    uploadFileAPI,
    getFile
  };
};

export default createS3;

import createS3 from "../../utils/S3amazon";
import { writeFile } from 'fs';
import { join } from "path";
interface Request {
  media: any;
  companyId: any;
  ticketId: any;
  isDownloadFile: any;
  mediaName?: any;
}

export interface S3Response {
  mediaBase64?: any;
  mediaUrlDownload?: any;
}

const ListService = async ({
  media,
  companyId,
  ticketId,
  isDownloadFile,
  mediaName
}: Request): Promise<S3Response> => {
  const s3 = createS3();
  let mediaBase64: any
  const { media: mediaFormatter } = await s3.getFile(process.env.S3_BUCKET, `imagens/${companyId}/${ticketId}/${media}`);
  mediaBase64 = mediaFormatter.toString('base64');

  if (isDownloadFile === "true") {
    const buffer = Buffer.from(mediaBase64, 'base64');

    writeFile(join(__dirname, '..', '..', '..', 'public', mediaName), buffer, (err) => {
      if (err) {
        console.error('Erro ao salvar o arquivo:', err);
      }
    });
    return { mediaUrlDownload: `${process.env.BACKEND_URL}/public/${mediaName}` }
  }
  return { mediaBase64: mediaBase64 };
};

export default ListService;

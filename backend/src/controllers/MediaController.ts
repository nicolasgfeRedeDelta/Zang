import { Response, Request } from 'express';
import ListService from '../services/MediaService/ListService';
import RemoveMediaService from '../services/MediaService/RemoveMediaService';

export const find = async (req: Request, res: Response): Promise<any> => {
  const params = req.query;
  const { companyId } = req.user;
  const media = params.media;
  const ticketId = params.ticketId;
  const isDownloadFile =  params.isDownloadFile
  const mediaName = params.mediaName; // usado somente para manter o nome original dos arquivos de download
  const s3Response = await ListService({ media, companyId, ticketId, isDownloadFile, mediaName}); 

  return res.json({ s3Response });
};

export const remove = async (req: Request, res: Response): Promise<any> => {
  const params = req.query;
  const media = params.media;
  await RemoveMediaService(media); 

  return res.json();
};
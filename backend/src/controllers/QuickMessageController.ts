import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListService from "../services/QuickMessageService/ListService";
import CreateService from "../services/QuickMessageService/CreateService";
import ShowService from "../services/QuickMessageService/ShowService";
import UpdateService from "../services/QuickMessageService/UpdateService";
import DeleteService from "../services/QuickMessageService/DeleteService";
import FindService from "../services/QuickMessageService/FindService";
import QuickMessage from "../models/QuickMessage";
import AppError from "../errors/AppError";
import { head } from "lodash";
import fs, { writeFile } from "fs"
import createS3 from "../utils/S3amazon";
import { join } from "path";

const s3 = createS3();

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  userId: string | number;
};

type StoreData = {
  color: string;
  shortcode: string;
  userId: number | number;
  messages: any;
  id: any
  modules: any[];
};

type FindParams = {
  companyId: string;
  userId: string;
  modules: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, userId } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    userId
  });

  return res.json({ records, count, hasMore });
};

function sleep(milliseconds: number) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export const downloadFiles = async (req: Request, res: Response) => {
  const data = req.body
  const user = req.user

  let mediaBuffer: any
  if (data.mediaUrl != null) {
    mediaBuffer = await s3.getFile(process.env.S3_BUCKET, `imagens/${user.companyId}/${'QuickMessages'}/${data.mediaUrl}`);
    fs.writeFile(join(__dirname, '..', '..', 'public', data.mediaUrl), mediaBuffer.media, (err) => {
      if (err) {
        console.error('Erro ao salvar o arquivo:', err);
      }
    });
  }

  return res.status(200).json({ message: "midias baixadas" });;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = JSON.parse(req.body.recipe) as StoreData;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(files) as Express.Multer.File;
  let fileAddName: any;

  data.messages.map((message: any) => {
    if (message.fileAdd === true) {
      delete message.fileAdd;
      fileAddName = message.mediaUrl
    }
  })

  if (file != undefined) {
    fs.readFile(file.path, async (err, buffer) => {
      await s3.uploadFile(process.env.S3_BUCKET, fileAddName, buffer, "QuickMessages", companyId);
      if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
      }
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Erro ao excluir o arquivo:', err);
        }
      });
    });
  }

  const schema = Yup.object().shape({
    color: Yup.string().required(),
    shortcode: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  for (let i = 0; i < data.modules.length; i++) {
    data.modules[i] = { modules: data.modules[i] };
  }
  
  if (data.modules.length === 0) {
    data.modules = null
  }

  const record = await CreateService({
    ...data,
    companyId,
    userId: req.user.id
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "create",
    record
  });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = JSON.parse(req.body.recipe) as StoreData;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(files) as Express.Multer.File;
  const id = data.id;
  let fileAddName: any;

  data.messages.map((message: any) => {
    if (message.fileAdd === true) {
      fileAddName = message.mediaUrl
    }
  })

  if (file != undefined) {
    fs.readFile(file.path, async (err, buffer) => {
      await s3.uploadFile(process.env.S3_BUCKET, fileAddName, buffer, "QuickMessages", companyId);
      if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
      }
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Erro ao excluir o arquivo:', err);
        }
      });
    });
  }

  const schema = Yup.object().shape({
    color: Yup.string().required(),
    shortcode: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await UpdateService({
    ...data,
    userId: req.user.id,
    id,
  });

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "update",
    record
  });

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await ShowService(id);

  await DeleteService(id);

  const io = getIO();
  io.emit(`company-${companyId}-quickmessage`, {
    action: "delete",
    id
  });

  return res.status(200).json({ message: "Contact deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: QuickMessage[] = await FindService(params);

  return res.status(200).json(records);
};

import { Request, Response } from "express";

import CreateService from "../services/QueueOptionService/CreateService";
import ListService from "../services/QueueOptionService/ListService";
import UpdateService from "../services/QueueOptionService/UpdateService";
import DeleteService from "../services/QueueOptionService/DeleteService";
import ShowQueueOptionServices from "../services/QueueOptionService/ShowQueueOptionServices";
import { head } from "lodash";
import fs from "fs"
import createS3 from "../utils/S3amazon";

const s3 = createS3();

type FilterList = {
  queueId: string | number;
  queueOptionId: string | number;
  chatbotId: string | number | boolean;
  agentId: string | number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { queueId, queueOptionId, chatbotId, agentId } = req.query as FilterList;

  const queueOptions = await ListService({ queueId, queueOptionId, chatbotId, agentId });

  return res.json(queueOptions);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const queueOptionData = req.body;

  const queueOption = await CreateService(queueOptionData);

  return res.status(200).json(queueOption);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueOptionId } = req.params;

  const queueOption = await ShowQueueOptionServices(queueOptionId);

  return res.status(200).json(queueOption);
};

function isJSON(str: any) {
  try {
    const obj = JSON.parse(str);
    return obj && typeof obj === 'object';
  } catch (e) {
    return false;
  }
}

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;
  const { companyId } = req.user;
  let queueOptionData: any;
  if (req.body.recipe === undefined) {
    queueOptionData = req.body;
  }else{
    queueOptionData = req.body.recipe;
  }
  if (isJSON(queueOptionData)) {
    queueOptionData = JSON.parse(req.body.recipe)
  }
  const medias = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(medias) as Express.Multer.File;
  let fileAddName: any;

  queueOptionData.options.map((chatbot: any) => {
    chatbot.messages.map((message: any) => {
      if (message.fileAdd === true) {
        delete message.fileAdd;
        fileAddName = message.mediaUrl;
      }
    })
  })

  if (file != undefined) {
    fs.readFile(file.path, async (err, buffer) => {
      await s3.uploadFile(process.env.S3_BUCKET, fileAddName, buffer, "Queues", companyId);
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


  const queueOption = await UpdateService(queueOptionId, queueOptionData);

  return res.status(200).json(queueOption);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueOptionId } = req.params;

  await DeleteService(queueOptionId);

  return res.status(200).json({ message: "Option Delected" });
};

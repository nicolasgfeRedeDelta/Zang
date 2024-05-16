import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import CreateQueueService from "../services/QueueService/CreateQueueService";
import DeleteQueueService from "../services/QueueService/DeleteQueueService";
import ListQueuesService from "../services/QueueService/ListQueuesService";
import ShowQueueService from "../services/QueueService/ShowQueueService";
import UpdateQueueService from "../services/QueueService/UpdateQueueService";
import { isNil } from "lodash";
import { head } from "lodash";
import fs from "fs"
import createS3 from "../utils/S3amazon";

const s3 = createS3();

type QueueFilter = {
  companyId: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId: userCompanyId } = req.user;
  const { companyId: queryCompanyId } = req.query as unknown as QueueFilter;
  let companyId = userCompanyId;

  if (!isNil(queryCompanyId)) {
    companyId = +queryCompanyId;
  }

  const queues = await ListQueuesService({ companyId });

  return res.status(200).json(queues);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name, color, greetingMessage, outOfHoursMessage, schedules } =
    req.body;
  const { companyId } = req.user;

  const queue = await CreateQueueService({
    name,
    color,
    greetingMessage,
    companyId,
    outOfHoursMessage,
    schedules
  });

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(200).json(queue);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  const queue = await ShowQueueService(queueId, companyId);

  return res.status(200).json(queue);
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
  let data: any
  const { queueId } = req.params;
  const { companyId } = req.user;
  if (req.body.recipe === undefined) {
    data = req.body;
  }else{
    data = req.body.recipe;
  }
  if (isJSON(data)) {
    data = JSON.parse(req.body.recipe)
  }
  const medias = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(medias) as Express.Multer.File;
  let fileAddName: any;

  data.chatbots.map((chatbot: any) => {
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
  
  const queue = await UpdateQueueService(queueId, data, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "update",
    queue
  });

  return res.status(201).json(queue);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueId } = req.params;
  const { companyId } = req.user;

  await DeleteQueueService(queueId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-queue`, {
    action: "delete",
    queueId: +queueId
  });

  return res.status(200).send();
};

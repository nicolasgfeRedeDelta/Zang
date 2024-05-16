import fs from 'fs';
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import { Readable } from 'stream';
import { join } from 'path';
import { getWbot } from '../libs/wbot';

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: [];
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  isQuickMessage?: boolean;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {

  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;
  const ticket = await ShowTicketService(ticketId, companyId);

  let objectBody: any = body;
  SetTicketMessagesAsRead(ticket);

  if (!objectBody.isQuickMessage) {
    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          const fileContent = await fs.promises.readFile(media.path);
          setTimeout(async () => { await fs.promises.unlink(media.path) }, 10000);
          const imageFormated: Express.Multer.File = {
            fieldname: '',
            originalname: media.originalname,
            encoding: '',
            mimetype: media.mimetype,
            size: media.size,
            destination: '',
            filename: media.filename,
            path: media.path,
            buffer: fileContent,
            stream: Readable.from(media.fieldname)
          };
          await SendWhatsAppMedia({ imageFormated, ticket });
        })
      );
    } else {
      await SendWhatsAppMessage({ body, ticket, quotedMsg });
    }
  }

  if (objectBody.isQuickMessage) {
    objectBody.mediaUrl = null;
    await SendWhatsAppMessage({ body: objectBody, ticket, quotedMsg });
  }

  return res.send();
}

export const storeMedia = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;
  const ticket = await ShowTicketService(ticketId, companyId);
  let objectBody: any = body;
  let fileBuffer: any;
  let dirName: string;
  SetTicketMessagesAsRead(ticket);

  if (objectBody.isQuickMessage) {
    try {
      dirName = join(__dirname, '..', '..', 'public', objectBody.mediaUrl);
      fileBuffer = await fs.promises.readFile(dirName);

      const imageFormated: Express.Multer.File = {
        fieldname: '',
        originalname: objectBody.mediaUrl,
        encoding: '',
        mimetype: objectBody.mimetype,
        size: fileBuffer.length,
        destination: '',
        filename: objectBody.mediaUrl,
        path: 'C:\\dev\\whatsokton\\backend\\public\\fakepath',
        buffer: fileBuffer,
        stream: Readable.from(objectBody.mediaUrl),
      };
      await SendWhatsAppMedia({ imageFormated, ticket, timeSendMessage: objectBody.timeSendMessage });
    } catch (error) {
      console.error('Erro ao ler o arquivo:', error);
    }
  }

  setTimeout(() => {
    fs.unlink(join(__dirname, '..', '..', 'public', objectBody.mediaUrl), async (err) => {
      if (err) {
        console.error('Erro ao excluir o arquivo:', err);
      }
    });
  }, 10000);

  return res.send();
}

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: string };
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (messageData.number === undefined) {
      throw new Error("O número é obrigatório");
    }

    const number = messageData.number;
    const body = messageData.body;
    const wbot = getWbot(parseInt(whatsappId));
    const isValidNumber = await wbot.onWhatsApp(`${number}`);
    const numberFormat = isValidNumber[0].jid.slice(0, 12);

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                number: numberFormat,
                body: media.originalname,
                mediaPath: media.path
              }
            },
            { removeOnComplete: true, attempts: 3 }
          );
        })
      );
    } else {
      req.app.get("queues").messageQueue.add(
        "SendMessage",
        {
          whatsappId,
          data: {
            number: numberFormat,
            body
          }
        },
        { removeOnComplete: true, attempts: 3 }
      );
    }

    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};

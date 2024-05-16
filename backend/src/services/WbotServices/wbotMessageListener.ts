import { promisify } from "util";
import { writeFile } from "fs";
import * as Sentry from "@sentry/node";
import { isNil, isNull, head } from "lodash";

import {
  downloadContentFromMessage,
  extractMessageContent,
  getContentType,
  jidNormalizedUser,
  MediaType,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageUpdate,
  WASocket
} from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";

import { getIO } from "../../libs/socket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { logger } from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { debounce } from "../../helpers/Debounce";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import formatBody from "../../helpers/Mustache";
import { Store } from "../../libs/store";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import moment from "moment";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import { Op, Sequelize } from "sequelize";
import { campaignQueue, GlobalVariables, parseToMilliseconds, randomValue } from "../../queues";
import User from "../../models/User";
import Setting from "../../models/Setting";
import { deleteAndCreateDialogStage } from "./ChatBotListener";
import DialogChatBots from "../../models/DialogChatBots";
import DeleteDialogChatBotsServices from "../DialogChatBotsServices/DeleteDialogChatBotsServices";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";
import createS3 from "../../utils/S3amazon";
import fs from "fs"
import { verifyMediaType } from "./SendWhatsAppMedia";
import { join } from "path";

let varCompanyId: number;
let firstMessage = true;
const s3 = createS3();
let HasCampaing: boolean;

type Session = any & {
  id?: number;
  store?: Store;
};

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

const writeFileAsync = promisify(writeFile);

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  return getContentType(msg.message);
};

const getBodyButton = (msg: proto.IWebMessageInfo): string => {
  try {
    if (msg?.message?.buttonsMessage?.contentText) {
      let bodyMessage = `*${msg?.message?.buttonsMessage?.contentText}*`;
      // eslint-disable-next-line no-restricted-syntax
      for (const buton of msg.message?.buttonsMessage?.buttons) {
        bodyMessage += `\n\n${buton.buttonText.displayText}`;
      }
      return bodyMessage;
    }
    if (msg?.message?.listMessage) {
      let bodyMessage = `*${msg?.message?.listMessage?.description}*`;
      // eslint-disable-next-line no-restricted-syntax
      for (const buton of msg.message?.listMessage?.sections[0]?.rows) {
        bodyMessage += `\n\n${buton.title}`;
      }
      return bodyMessage;
    }
    if (msg.message?.viewOnceMessage?.message?.listMessage) {
      const obj = msg.message?.viewOnceMessage?.message.listMessage;
      let bodyMessage = `*${obj.description}*`;
      // eslint-disable-next-line no-restricted-syntax
      for (const buton of obj.sections[0]?.rows) {
        bodyMessage += `\n\n${buton.title}`;
      }

      return bodyMessage;
    }
    if (msg.message?.viewOnceMessage?.message?.buttonsMessage) {
      const obj = msg.message?.viewOnceMessage?.message.buttonsMessage;
      let bodyMessage = `*${obj.contentText}*`;
      // eslint-disable-next-line no-restricted-syntax
      for (const buton of obj?.buttons) {
        bodyMessage += `\n\n${buton.buttonText.displayText}`;
      }
      return bodyMessage;
    }
  } catch (error) {
    logger.error(error);
  }
};

const msgLocation = (
  image: ArrayBuffer,
  latitude: number,
  longitude: number
) => {
  if (image) {
    const b64 = Buffer.from(image).toString("base64");

    const data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
    return data;
  }
};

export const getBodyMessageButton = (msg: proto.IWebMessageInfo): string | null => {
  try {
    const type = getTypeMessage(msg);
    if (!type) {
      console.log("não achou o  type 90");
      return;
    }

    const types = {
      conversation: msg.message.conversation,
      imageMessage: msg.message.imageMessage?.caption,
      videoMessage: msg.message.videoMessage?.caption,
      extendedTextMessage:
        getBodyButton(msg) ||
        msg.message.extendedTextMessage?.text ||
        msg.message?.listMessage?.description,
      buttonsResponseMessage:
        msg.message.buttonsResponseMessage?.selectedDisplayText,
      listResponseMessage:
        msg?.message?.listResponseMessage?.title || "Chegou Aqui",
      templateButtonReplyMessage:
        msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo:
        msg.message.buttonsResponseMessage?.selectedButtonId ||
        msg.message.listResponseMessage?.title,
      buttonsMessage:
        getBodyButton(msg) || msg.message.listResponseMessage?.title,
      stickerMessage: "sticker",
      contactMessage: msg.message.contactMessage?.vcard,
      contactsArrayMessage: "varios contatos",
      locationMessage: msgLocation(
        msg.message?.locationMessage?.jpegThumbnail,
        msg.message?.locationMessage?.degreesLatitude,
        msg.message?.locationMessage?.degreesLongitude
      ),
      liveLocationMessage: `Latitude: ${msg.message.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message.documentMessage?.title,
      audioMessage: "Áudio",
      reactionMessage: msg.message?.reactionMessage?.text,
      ephemeralMessage:
        msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text,
      protocolMessage: msg.message?.protocolMessage?.type,
      listMessage: getBodyButton(msg) || msg.message?.listMessage?.description,
      viewOnceMessage: getBodyButton(msg)
    };

    const objKey = Object.keys(types).find(objKeyz => objKeyz === type);

    if (!objKey) {
      logger.warn(`#### Nao achou o type em getBodyMessage: ${type}
    ${JSON.stringify(msg?.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
      Sentry.captureException(
        new Error("Novo Tipo de Mensagem em getBodyMessage")
      );
    }

    return types[type];
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    console.log(error);
  }
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {
  return (
    msg.message?.conversation ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.message?.templateButtonReplyMessage?.selectedId ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.title ||
    msg.message?.contactMessage?.vcard
  );
};

export const getQuotedMessage = (msg: proto.IWebMessageInfo): any => {
  const body =
    msg.message.imageMessage.contextInfo ||
    msg.message.videoMessage.contextInfo ||
    msg.message.extendedTextMessage.contextInfo ||
    msg.message.buttonsResponseMessage.contextInfo ||
    msg.message.listResponseMessage.contextInfo ||
    msg.message.templateButtonReplyMessage.contextInfo ||
    msg.message.buttonsResponseMessage?.contextInfo ||
    msg.message.listResponseMessage?.contextInfo;

  return extractMessageContent(body[Object.keys(body).values().next().value]);
};

export const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];

  return body?.contextInfo?.stanzaId;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  };
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId =
    msg.participant || msg.key.participant || msg.key.remoteJid || undefined;

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  if (wbot.type === "legacy") {
    return wbot.store.contacts[msg.key.participant || msg.key.remoteJid] as IMe;
  }

  const isGroup = msg.key.remoteJid.includes("g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? {
      id: getSenderMessage(msg, wbot),
      name: msg.pushName
    }
    : {
      id: msg.key.remoteJid,
      name: msg.key.fromMe ? rawNumber : msg.pushName
    };
};

const downloadMedia = async (msg: proto.IWebMessageInfo) => {
  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.documentMessage;

  const messageType = mineType.mimetype
    .split("/")[0]
    .replace("application", "document")
    ? (mineType.mimetype
      .split("/")[0]
      .replace("application", "document") as MediaType)
    : (mineType.mimetype.split("/")[0] as MediaType);

  const stream = await downloadContentFromMessage(
    msg.message.audioMessage ||
    msg.message.videoMessage ||
    msg.message.documentMessage ||
    msg.message.imageMessage ||
    msg.message.stickerMessage ||
    msg.message.extendedTextMessage?.contextInfo.quotedMessage.imageMessage,
    messageType
  );

  let buffer = Buffer.from([]);

  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (!buffer) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

  let filename = msg.message?.documentMessage?.fileName || "";
  let fileKey: string;

  if (!filename) {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    fileKey = `${new Date().getTime()}.${ext}`;
  }

  const media = {
    data: buffer,
    mimetype: mineType.mimetype,
    filename,
    fileKey
  };

  return media;
};

const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  let profilePicUrl: string;
  try {
    profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  } catch (e) {
    Sentry.captureException(e);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  const contactData = {
    name: msgContact.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id,
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId
  };
  varCompanyId = companyId

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quoted }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const media = await downloadMedia(msg);


  if (!media) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  let file: string
  if (media.mimetype.split("/")[0] !== "image" && media.mimetype.split("/")[0] !== "video" && media.mimetype.split("/")[0] !== "audio") {
    file = media.fileKey;
  } else {
    file = media.filename;
  }

  try {
    await s3.uploadFile(process.env.S3_BUCKET, file, media.data, ticket.id.toString(), varCompanyId);
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }

  const body = getBodyMessage(msg);
  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body ? body : media.filename,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: file,
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg)
  };

  await ticket.update({
    lastMessage: body || media.filename
  });

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId
  });

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.to(ticket.status)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  return newMessage;
};

export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  notMessageTypeText?: boolean
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  let body: string;
  body = getBodyMessage(msg);
  if (notMessageTypeText) {
    body = getBodyMessageButton(msg);
  }
  const type = getTypeMessage(msg);
  if (type == "listResponseMessage") {
    body = msg.message?.listResponseMessage.title;
  } else if (type == "buttonsResponseMessage") {
    body = msg.message?.buttonsResponseMessage.selectedDisplayText;
  } else if (type === "contactMessage") {
    const nameContact = msg.message?.contactMessage.displayName;
    const regex = /waid=(\d+):/;
    const numberContact = body.match(regex);
    body = `${nameContact}, ${numberContact[1]}`;
  }

  const messageData = {
    id: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.status,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg)
  };

  await ticket.update({
    lastMessage: body
  });

  await CreateMessageService({ messageData, companyId: ticket.companyId });

  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.to(ticket.status)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  const msgType = getTypeMessage(msg);
  const ifType =
    msgType === "conversation" ||
    msgType === "extendedTextMessage" ||
    msgType === "audioMessage" ||
    msgType === "videoMessage" ||
    msgType === "imageMessage" ||
    msgType === "documentMessage" ||
    msgType === "stickerMessage" ||
    msgType === "buttonsResponseMessage" ||
    msgType === "listResponseMessage" ||
    msgType === "contactMessage";

  return !!ifType;
};

const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact
) => {
  const { queues, greetingMessage } = await ShowWhatsAppService(
    wbot.id!,
    ticket.companyId
  );

  if (queues.length === 1) {
    if (greetingMessage != "") {
      await wbot.sendMessage(
        `${contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
        {
          text: greetingMessage
        }
      );
    }
    const firstQueue = head(queues);
    let chatbot = false;
    if (firstQueue?.chatbots) {
      chatbot = firstQueue.chatbots.length > 0;
    }
    await UpdateTicketService({
      ticketData: { queueId: firstQueue?.id, chatbot, status: chatbot ? "chatbot" : "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });

    return;
  }

  let selectedOption =
    msg.message?.conversation ||
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    (msg.message?.extendedTextMessage?.text as string);

  const buttonActive = await Setting.findOne({
    where: {
      key: "chatBotType",
      companyId: ticket.companyId
    }
  });

  let choosenQueue = null;
  if (!firstMessage) {
    if (selectedOption.startsWith('*')) {
      const removedAtendent = selectedOption.split(`\n`)
      selectedOption = removedAtendent[removedAtendent.length - 1]
    }
    choosenQueue = queues[+selectedOption - 1];
  }

  if (choosenQueue) {
    firstMessage = true;
    let chatbot = false;
    if (choosenQueue?.chatbots) {
      chatbot = choosenQueue.chatbots.length > 0;
    }
    let newStatus = "pending";
    if (chatbot) {
      newStatus = "chatbot";
    } else {
      handleEmitIo(ticket.companyId);
    }
    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id, chatbot, status: newStatus },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });

    if (choosenQueue.chatbots.length == 0) {
      if (choosenQueue.greetingMessage != "" && choosenQueue.greetingMessage != null) {
        const body = `\u200e${choosenQueue.greetingMessage}`;
        const sentMessage = await sendMessageText(wbot, ticket, body, contact);
        await verifyMessage(sentMessage, ticket, contact);
      }
    }
  } else {
    firstMessage = false;
    let options = "";

    const buttons = [];
    queues.forEach((queue, index) => {
      buttons.push({
        buttonId: `${index + 1}`,
        buttonText: { displayText: queue.name },
        type: 4
      });
    });

    queues.forEach((queue, index) => {
      options += `*${index + 1}* - ${queue.name}\n`;
    });

    const body = formatBody(
      `${options}`,
      ticket.contact
    );

    if (buttonActive.value === "text") {
      const debouncedSentMessage = debounce(
        async () => {
          try {
            if (body === "") {
              throw new Error('greetingMessage é vazio!');
            }
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: greetingMessage
              }
            );
            const sentMessage = await sendMessageText(wbot, ticket, body, contact);
            verifyMessage(sentMessage, ticket, contact);
          } catch (error) {
            throw logger.error(error);
          }
        },
        3000,
        ticket.id
      );

      debouncedSentMessage();
    }

    if (buttonActive.value === "button" && queues.length > 4) {
      const debouncedSentMessage = debounce(
        async () => {
          const sentMessage = await sendMessageButton(wbot, contact, buttons, ticket, greetingMessage)
          verifyMessage(sentMessage, ticket, contact, true);
        },
        3000,
        ticket.id
      );

      debouncedSentMessage();

      // return botText();
    }

    if (buttonActive.value === "button" && queues.length <= 4) {
      console.log("type: button");
      // return botButton();
    }

    if (buttonActive.value === "list") {
      try {
        const sectionsRows = [];

        queues.forEach((queue, index) => {
          sectionsRows.push({
            title: queue.name,
            rowId: `${index + 1}`
          });
        });

        const sections = [
          {
            title: "Menu",
            rows: sectionsRows
          }
        ];
        const listMessage = {
          text: formatBody(`\u200e${greetingMessage}`, contact),
          buttonText: "Escolha uma opção",
          sections
        };

        const sendMsg = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "" : "s.whatsapp.net"}`,
          listMessage
        );
        await verifyMessage(sendMsg, ticket, contact, true)
      } catch (error) {
        throw logger.error(error);
      }
    }
  }
};

const handleEmitIo = (companyId: number) => {
  const io = getIO();

  io.emit(`company-${companyId}-ticket-chatbot`, {
    action: "updateListCount",
  });
}

const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};

const handleRating = async (
  msg: WAMessage,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();
  let rate: number | null = null;

  if (msg.message?.conversation) {
    rate = +msg.message?.conversation;
  }

  if (!Number.isNaN(rate) && Number.isInteger(rate) && !isNull(rate)) {
    const { complationMessage } = await ShowWhatsAppService(
      ticket.whatsappId,
      ticket.companyId
    );

    let finalRate = rate;

    if (rate < 1) {
      finalRate = 1;
    }
    if (rate > 3) {
      finalRate = 3;
    }

    await UserRating.create({
      ticketId: ticketTraking.ticketId,
      companyId: ticketTraking.companyId,
      userId: ticketTraking.userId,
      rate: finalRate
    });

    const body = [];
    body.push(`\u200e${complationMessage}`)

    await SendWhatsAppMessage({ body, ticket });

    await ticketTraking.update({
      finishedAt: moment().toDate(),
      rated: true
    });

    await ticket.update({
      queueId: null,
      userId: null,
      status: "closed"
    });

    io.to("open").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.to(ticket.status)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

const handleChartbot = async (
  ticket: Ticket,
  msg?: WAMessage,
  wbot?: Session,
  dontReadTheFirstQuestion: boolean = false
) => {
  let messageBody = getBodyMessage(msg);

  if (messageBody.startsWith('*')) {
    const removedAtendent = messageBody.split(`\n`)
    messageBody = removedAtendent[removedAtendent.length - 1]
  }

  let queue: any = {};
  const bots = await DialogChatBots.findAll(
    {
      where: {
        contactId: ticket.contact.id,
        // chatbotId: {[Op.not]: null},
        queueId: ticket.queueId
      },
      order:
        [["createdAt", "ASC"]]
    }
  );
  let queueOptionId = null;
  let newQueueOptionId = null;
  //Verificar se esistre registro na tabela DialogChatBots(CONTACTID))
  if (bots.length == 0) {
    queue = await Queue.findByPk(ticket.queueId, {
      include: [
        {
          model: QueueOption,
          as: "chatbots",
          where: {
            chatbotId: null,
            queueId: ticket.queue.id
          }
        }
      ],
      order: [
        [
          { model: QueueOption, as: "chatbots" },
          "createdAt", "ASC"
        ]
      ]
    });

    if (messageBody == "00") {
      await messageBodyHome(ticket, wbot, msg);
    } else if (!isNil(ticket.queueOptionId) && messageBody == "0") {
      await messageBodyBack(ticket);
    } else if (!isNull(ticket.queueOptionId) && messageBody != "#") {
      newQueueOptionId = queue?.chatbots[parseInt(messageBody) - 1].id;
    }

  } else {
    let buscaFila = null;
    if (bots[0].chatbotId) {
      buscaFila = await QueueOption.findAll({
        where: {
          chatbotId: bots[0].chatbotId
        },
        order:
          [["createdAt", "ASC"]]
      });
    } else {
      buscaFila = await QueueOption.findAll({
        where: {
          queueId: ticket.queueId
        },
        order:
          [["createdAt", "ASC"]]
      });
    };
    queue = { ...buscaFila[0], chatbots: buscaFila }
    queueOptionId = bots[0].chatbotId;
  }

  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "#") {
    return await messageBodyAttendant(ticket, wbot);
  };
  if (await validations(ticket, messageBody, wbot, queue, msg, dontReadTheFirstQuestion)) {
    await ticket.reload();
    await buildMessage(ticket, queue, wbot, messageBody, (bots.length == 0));
  } else {
    await invalidMessage(ticket, wbot);
    await sendMessageInvalidate(ticket, wbot)
  }
};

const validations = async (
  ticket: Ticket,
  messageBody: string,
  wbot: Session,
  queue: Queue,
  msg: WAMessage,
  dontReadTheFirstQuestion: boolean
): Promise<boolean> => {
  try {
    if (messageBody == "00") {
      // voltar para o menu inicial
      await DeleteDialogChatBotsServices(ticket.contactId);
      return await messageBodyHome(ticket, wbot, msg);
    } else if (!isNil(queue) && messageBody == "0") {
      return await messageBodyBack(ticket);
    } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
      // escolheu uma opção
      return await chooseAnOption(ticket, messageBody, queue, wbot);
    } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !dontReadTheFirstQuestion) {
      // não linha a primeira pergunta
      const optionId = queue?.chatbots[parseInt(messageBody) - 1].id;
      ticket.update({ queueOptionId: optionId });
      await deleteAndCreateDialogStage(ticket.contact, optionId, ticket);
      return true;
    } else if (!isNil(queue) && isNil(ticket.queueOptionId)) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const sendMessageInvalidate = async (ticket: Ticket, wbot: Session) => {
  if (ticket.chatbot) {
    if (isNull(ticket.queueOptionId)) {
      const { chatbots, greetingMessage } = await Queue.findByPk(ticket.queueId, {
        include: [
          {
            model: QueueOption,
            as: "chatbots",
            include: [
              {
                model: QueueOptionMessageResponses,
                as: "messages",
                order: [['id', 'ASC']], // Ordena as mensagens em ordem ascendente
              }
            ]
          }
        ],
        order: [[Sequelize.literal('"chatbots.id"'), 'ASC']]
      });

      const body = mountResponse(chatbots, greetingMessage, false, true)
      await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
    } else {
      const teste = await QueueOption.findAll({
        where: {
          chatbotId: ticket.queueOptionId
        },
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            order: [["id", "DESC"]]
          }
        ]
      })
      const body = mountResponse(teste, undefined, false, true);
      await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
    }
  }
}

const mountResponse = (options: QueueOption[], title: string | undefined, toBack: boolean, toHome: boolean): string => {
  let body = "";
  if (title) {
    body = `${(title)}\n\n`;
  }

  options.map((msg, i) => {
    body += (`*${i + 1}* - ${msg.title}\n`);
  })

  if (toBack) {
    body += "\n*0* - *Voltar*\n";
  }

  if (toHome) {
    body += "\n*00* - *Menu inicial*";
  }
  return body;
}

const directToAgent = (
  ticket: Ticket,
  option: QueueOption
): Promise<void> => {
  ticket.update({ chatbot: false, userId: option.agentId, status: "pending" })
  return
}

const chooseAnOption = async (
  ticket: Ticket,
  messageBody: string,
  queue: Queue,
  wbot: Session
): Promise<boolean> => {
  try {
    const count = await QueueOption.count({
      where: { chatbotId: ticket.queueOptionId }
    });

    let option: any = {};
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { chatbotId: ticket.queueOptionId }
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: messageBody || "",
          chatbotId: ticket.queueOptionId
        }
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    } else {
      const optionId = queue?.chatbots[parseInt(messageBody) - 1].id;
      if (optionId) {
        await ticket.update({ queueOptionId: optionId });
      } else {
        await invalidMessage(ticket, wbot);
      }
    }
    return true
  } catch (error) {
    console.log(error);
    return false
  }

};

const invalidMessage = async (
  ticket: Ticket,
  wbot: Session
): Promise<boolean> => {
  try {
    await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: "\u200eNão entendi a opção selecionada, por favor selecione novamente."
      }
    );
    return true
  } catch (error) {
    console.log(error);
    return false
  }
};

const messageBodyHome = async (
  ticket: Ticket,
  wbot: Session,
  msg: WAMessage
): Promise<boolean> => {
  try {
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    await DeleteDialogChatBotsServices(ticket.contact.id);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const messageBodyAttendant = async (
  ticket: Ticket,
  wbot: Session
): Promise<boolean> => { // falar com atendente
  try {
    await ticket.update({ queueOptionId: null, chatbot: false });
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
      {
        text: "\u200eAguarde, você será atendido em instantes."
      }
    );

    await ticket.update({ status: "pending" });

    verifyMessage(sentMessage, ticket, ticket.contact);

    await DeleteDialogChatBotsServices(ticket.contact.id);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const messageBodyBack = async (
  ticket: Ticket,
): Promise<boolean> => {
  // voltar para o menu anterior
  try {
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.chatbotId });

    if (ticket.queueOptionId) {
      if (!ticket.queueId) {
        //faz quando recebe  ticket. queueId
        await deleteAndCreateDialogStage(ticket.contact, ticket.queueOptionId, ticket)
      } else {
        await deleteAndCreateDialogStage(ticket.contact, ticket.queueOptionId, ticket, ticket.queueId)
      }
    } else {
      // quando não recebe ticket.queueid deve somente apagar o atributo da tabela dialogchat
      // aqui quando precisa voltar a opção para o primeiro nivel de pergunta, deve apagar o atributo da tabela dialogchat, para entrar no processo inicial de validação de mensagem
      await DeleteDialogChatBotsServices(ticket.contact.id)
      return true;
    }

    return true
  } catch (error) {
    console.log(error);
    return false
  }
};

const buildMessage = async (
  ticket: Ticket,
  queue: Queue,
  wbot: Session,
  messageBody: string,
  bots?: Boolean
): Promise<boolean> => {
  try {
    if (!isNil(queue) && isNil(ticket.queueOptionId) && bots) {
      await firstChatBot(ticket, queue, wbot);
      // Apenas deve entrar quando estiver selecionando a a opção da fila (primeiro chatbot)
    } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !bots) {
      await backOptionQueue(ticket, wbot);
      // Só vai cair nesta codição quando o estiver voltando a opção para uma listar as opções de filas
    } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
      // Deve buscar por aqui todas as opções que o vinculo com a seleção for com a mesma tabela
      await queueChatBot(ticket, queue, wbot, messageBody, bots);
    }
    return true;
  } catch (error) {
    console.log(error);
    return false
  }
};

const backOptionQueue = async (
  ticket: Ticket,
  wbot: Session
) => {
  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "chatbots",
        separate: true,
        order: [['id', 'ASC']],
      }
    ]
  })
  const body = mountResponse(queue.chatbots, queue.greetingMessage, false, true);

  await sendMessageType(wbot, ticket, body, queue.chatbots, queue.greetingMessage);
};

const firstChatBot = async (
  ticket: Ticket,
  queue: Queue,
  wbot: Session
): Promise<boolean> => {
  try {
    let queueOptions: any = {};

    queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, chatbotId: null },
      include: [
        {
          model: QueueOptionMessageResponses,
          as: "messages",
          separate: true,
          order: [['id', 'ASC']],
        }
      ],
      order: [
        ["createdAt", "ASC"]
      ]
    });

    const body = mountResponse(queueOptions, queue.greetingMessage, false, true);

    await sendMessageType(wbot, ticket, body, queueOptions, queue.greetingMessage);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const sendMessageType = async (
  wbot: Session,
  ticket: Ticket,
  body: string,
  queueOptions: any,
  greetingMessage: string
) => {
  try {
    if (body === "") {
      throw new Error('Body é vazio!');
    }
    const buttonActive = await Setting.findOne({
      where: {
        key: "chatBotType",
        companyId: ticket.companyId
      }
    });
    if (buttonActive.value === "text") {
      const debouncedSentMessage = debounce(
        async () => {
          const sentMessage = await sendMessageText(wbot, ticket, body);
          verifyMessage(sentMessage, ticket, ticket.contact);
        },
        3000,
        ticket.id
      );
      await deleteAndCreateDialogStage(ticket.contact, ticket.queueOptionId, ticket);
      debouncedSentMessage();
    }
  } catch (error) {
    logger.error(error);
  }
};

const formateMessage = (msg: QueueOptionMessageResponses) => {
  let messageFormated = []
  let message: String
  let timeEnv: Number
  let isFile: boolean

  if (msg != null) {
    if (msg.message != null && msg.mediaUrl === null) {
      message = msg.message;
      timeEnv = msg.timeSendMessage * 1000;
      isFile = false;
    } else if (msg.mediaUrl != null && msg.message === null) {
      message = msg.mediaUrl;
      timeEnv = msg.timeSendMessage * 1000;
      isFile = true;
    }
  }
  messageFormated.push({ message: message, timeEnv: timeEnv, isFile: isFile })
  return messageFormated
}

const queueChatBot = async (
  ticket: Ticket,
  queue: any,
  wbot: Session,
  messageBody: string,
  bots: Boolean
) => {
  let InitialQueue: any
  if (queue.autoSelectUser == undefined) {
    InitialQueue = await Queue.findByPk(queue.dataValues.queueId)
  }

  let validateAutoSelectUser = queue.autoSelectUser !== undefined ? queue.autoSelectUser : InitialQueue.autoSelectUser;

  const currentOption = await QueueOption.findByPk(ticket.queueOptionId, {
    include: [
      {
        model: QueueOptionMessageResponses,
        as: "messages",
        separate: true,
        order: [['id', 'ASC']],
      }
    ]
  })
  const queueOptions = await QueueOption.findAll({
    where: { chatbotId: ticket.queueOptionId },
    include: [
      {
        model: QueueOptionMessageResponses,
        as: "messages",
        separate: true,
        order: [['id', 'ASC']],
      }
    ],
    order: [
      ["option", "ASC"],
      ["createdAt", "ASC"]
    ]
  });
  let body = [];
  let options = "";
  let initialMessages = [];
  let aditionalOptions = "\n";

  if (queueOptions.length > 1) {
    currentOption.messages.map(msg => {
      if (!isNil(msg)) {
        body.push(formateMessage(msg));
      }
    })

    if (queueOptions.length == 0) {
      aditionalOptions = `*#* - *Falar com o atendente*\n`;
    }

    queueOptions.forEach((option, i) => {
      options += `*${i + 1}* - ${option.title}\n`;
    });

    if (options !== "") {
      aditionalOptions += options;
    }

    aditionalOptions += "\n*0* - *Voltar*\n";
    aditionalOptions += "*00* - *Menu inicial*";

    body.push(aditionalOptions);
  } else {
    const firstOption = head(queueOptions);
    const option = queue?.chatbots[parseInt(messageBody) - 1];
    if (firstOption) {
      await DeleteDialogChatBotsServices(ticket.contactId);
      if (validateAutoSelectUser != true) {
        await ticket.update({ chatbot: false, queueOptionId: null, status: "pending" });
      }
      body.push(`${firstOption?.title}`);
      firstOption.messages.map(msg => {
        if (msg) {
          body.push(formateMessage(msg));
        }
      })
    } else {
      if (!option.isAgent) {
        await DeleteDialogChatBotsServices(ticket.contactId);
        if (validateAutoSelectUser != true) {
          await ticket.update({ chatbot: false, queueOptionId: null, status: "pending" });
        }
        handleEmitIo(ticket.companyId);
        if (option.messages.length != 0) {
          option.messages.map(msg => {
            if (msg) {
              body.push(formateMessage(msg));
            }
          })
        } else {
          await messageBodyAttendant(ticket, wbot);
        }
        //quando não tem mensagem envia messageBodyAttendant
        //quando tem mensagem envia as opções
      } else {
        await DeleteDialogChatBotsServices(ticket.contactId);
        await directToAgent(ticket, option);
        option.messages.map(msg => {
          body.push(formateMessage(msg));
        })
      }
    }
  }
  if (body.length > 0) {
    sendMessage(body, ticket, wbot, messageBody);
  }
};

const sendMessage = (
  body: any[],
  ticket: Ticket,
  wbot: Session,
  messageBody: string,
) => {
  const debouncedSentMessage = debounce(
    async () => {
      for (const msgs of body) {// esses for pegam as mensagens e o tempo de aguardo para o enviop dela
        const bodyIsArray = Array.isArray(msgs)
        if (bodyIsArray) {//nesse if ele vai pegas as partes do body e verificar se e array ou nao
          for (const msg of msgs) {
            try {
              if (!msg.isFile) {
                await new Promise(resolve => setTimeout(resolve, msg.timeEnv));
                const sentMessage = await wbot.sendMessage(
                  `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                  {
                    text: msg.message
                  }
                );
                verifyMessage(sentMessage, ticket, ticket.contact);
              } else {//aqui e aonde ele monta as medias para enviar no chatbot, busca no s3 e envia
                const body = await s3.getFile(process.env.S3_BUCKET, `imagens/${ticket.companyId}/${"Queues"}/${msg.message}`);
                const queueOption = await QueueOptionMessageResponses.findOne({
                  where: { mediaUrl: msg.message }
                });
                const midiaFormater = await verifyMediaType(body.media, msg.message, queueOption.mimetype);
                await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...midiaFormater });
              }
            } catch (error) {
              throw logger.error(error);
            }
          }
        } else {// aqui apos as mensagens serem mandadas vai enviar a proxima opção do chatbot se tiver proxima
          const sizeOption = body.length;
          const optionsSend = body[sizeOption - 1]
          await wbot.sendMessage(
            `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
            {
              text: optionsSend
            }
          );
        }
      }
    },
    500,
    ticket.id
  );

  setTimeout(() => {
    if (messageBody !== "0") {
      deleteAndCreateDialogStage(ticket.contact, ticket.queueOptionId, ticket);
    }
    debouncedSentMessage();
  }, 1000);
}
const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number
): Promise<void> => {
  if (!isValidMsg(msg)) {
    return;
  }

  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;
    let bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const hasMedia =
      msg.message?.audioMessage ||
      msg.message?.imageMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage ||
      msg.message.stickerMessage;

    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage)) {
        bodyMessage = bodyMessage.replace(/\u200e/g, '');
        if (/\u200e/.test(bodyMessage)) return;
      };

      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "vcard" &&
        msgType !== "contactMessage"
      )
        return;
      msgContact = await getContactMessage(msg, wbot);
    } else {
      msgContact = await getContactMessage(msg, wbot);
    }

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    if (isGroup) {
      const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid, false);
      const msgGroupContact = {
        id: grupoMeta.id,
        name: grupoMeta.subject
      };
      groupContact = await verifyContact(msgGroupContact, wbot, companyId);
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);

    const count = wbot.store.chats.get(
      msg.key.remoteJid || msg.key.participant
    );

    const unreadMessages = msg.key.fromMe ? 0 : count?.unreadCount || 1;

    const contact = await verifyContact(msgContact, wbot, companyId);

    if (
      unreadMessages === 0 &&
      whatsapp.farewellMessage &&
      formatBody(whatsapp.farewellMessage, contact) === bodyMessage
    ) {
      return;
    }

    const body = getBodyMessage(msg);
    const isCampaign = /\u200f/.test(body);

    const ticket = await FindOrCreateTicketService(
      contact,
      wbot.id!,
      unreadMessages,
      companyId,
      groupContact,
      whatsapp.queues,
      isCampaign
    );

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: whatsapp?.id
    });

    try {
      if (!msg.key.fromMe) {
        /**
         * Tratamento para avaliação do atendente
         */
        if (ticketTraking !== null && verifyRating(ticketTraking)) {
          handleRating(msg, ticket, ticketTraking);
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (hasMedia) {
      await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    const currentSchedule = await VerifyCurrentSchedule(companyId);

    const scheduleType = await Setting.findOne({
      where: {
        companyId,
        key: "scheduleType"
      }
    });

    try {
      if (!msg.key.fromMe && scheduleType) {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         */
        if (
          scheduleType.value === "company" &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {
          const body = `${whatsapp.outOfHoursMessage}`;

          const debouncedSentMessage = debounce(
            async () => {
              await sendMessageText(wbot, ticket, body)
            },
            3000,
            ticket.id
          );
          debouncedSentMessage();
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    const dontReadTheFirstQuestion = ticket.queue === null;

    if (
      !ticket.queue &&
      !isGroup &&
      !msg.key.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1
    ) {
      await verifyQueue(wbot, msg, ticket, ticket.contact);
    }

    await ticket.reload();
    try {

      if (!msg.key.fromMe &&
        scheduleType &&
        ticket.queueId !== null) {
        /**
         * Tratamento para envio de mensagem quando a fila está fora do expediente
         */
        const queue = await Queue.findByPk(ticket.queueId);

        const { schedules }: any = queue;
        const now = moment();
        const weekday = now.format("dddd").toLowerCase();
        let schedule = null;

        if (Array.isArray(schedules) && schedules.length > 0) {
          schedule = schedules.find(
            s =>
              s.weekdayEn === weekday &&
              s.startTime !== "" &&
              s.startTime !== null &&
              s.endTime !== "" &&
              s.endTime !== null
          );
        }
        if (
          scheduleType.value === "queue" &&
          queue.outOfHoursMessage !== null &&
          queue.outOfHoursMessage !== "" &&
          !isNil(schedule)
        ) {
          const startTime = moment(schedule.startTime, "HH:mm");
          const endTime = moment(schedule.endTime, "HH:mm");

          if (now.isBefore(startTime) || now.isAfter(endTime)) {
            const body = `${queue.outOfHoursMessage}`;
            const debouncedSentMessage = debounce(
              async () => {
                await sendMessageText(wbot, ticket, body);
              },
              3000,
              ticket.id
            );
            debouncedSentMessage();
            return;
          }
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (whatsapp.queues.length == 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot);
      }
    }
    if (whatsapp.queues.length > 1 && ticket.queue) {
      if (ticket.chatbot && !msg.key.fromMe) {
        await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
      }
    }

    if (isNull(ticket.queueId) && ticket.status !== "open" && !msg.key.fromMe) {
      const greetingMessage = whatsapp.greetingMessage || "";
      if (greetingMessage !== "") {
        // sendMessageText(wbot, ticket, greetingMessage);
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};


const sendMessageButton = async (
  wbot: Session,
  contact: Contact,
  buttons: any[],
  ticket: Ticket,
  body: string
): Promise<proto.IWebMessageInfo> => {
  let buttonMessage: { text: string, buttons: any[], headerType: number };
  if (body) {
    if (buttons.length > 0) {
      buttonMessage = {
        text: formatBody(body + `\nSelecione uma opção:`, contact),
        buttons,
        headerType: 4
      };
    } else {
      return sendMessageText(wbot, ticket, body);
    }
  } else {
    buttonMessage = {
      text: formatBody(`Selecione uma opção:`, contact),
      buttons,
      headerType: 4
    };
  }

  return await wbot.sendMessage(
    `${contact.number}@${ticket.isGroup ? "" : "s.whatsapp.net"}`,
    buttonMessage
  );
}

const sendMessageText = async (
  wbot: Session,
  ticket: Ticket,
  body: string,
  contact?: Contact
): Promise<proto.IWebMessageInfo> => {
  try {
    if (body === "") {
      throw new Error('Body é vazio!');
    }
    var number = ticket.contact.number
    if (contact) {
      number = contact.number;
    }
    return await wbot.sendMessage(
      `${number}@${ticket.isGroup ? "" : "s.whatsapp.net"
      }`,
      {
        text: body
      }
    );
  } catch (error) {
    throw logger.error(error);
  }
}

const sendMessageList = async (
  wbot: Session,
  ticket: Ticket,
  body: any
): Promise<proto.IWebMessageInfo> => {
  return await wbot.sendMessage(
    `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
    body
  );
}

const handleMsgAck = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise(r => setTimeout(r, 500));
  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.key.id, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ]
    });

    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: chat });
    // Comentado trecho de codigo para testar se a remoção do `to(messageToUpdate.ticketId.toString())` vai ocasionar problemas.
    // io.to(messageToUpdate.ticketId.toString()).emit(
    io.emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      {
        action: "update",
        message: messageToUpdate
      }
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  if (!message.key.fromMe) {
    const number = message.key.remoteJid.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true }
    });
    if (campaigns) {
      const ids = campaigns.map(c => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null }
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10))
          }
        );
      }
    }
  }
};

const verifyCampaignMessageAndAddQueue = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  const body = getBodyMessage(message);
  const isCampaign = /\u200f/.test(body);
  if (message.key.fromMe && isCampaign) {

    const campaign = await Campaign.findAll({
      where: { id: GlobalVariables.currentCampaignId }
    });

    const messageRecord = await Message.findOne({
      where: { id: message.key.id!, companyId }
    });
    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    let queueid = campaign[0].queueId

    if (ticket.queueId == null || campaign[0].updateQueue == true) {
      await Ticket.update(
        { queueId: queueid },
        { where: { id: ticket.id } }
      );
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  verifyCampaignMessageAndAddQueue(message, companyId);
  const io = getIO();
  const body = getBodyMessage(message);
  const isCampaign = /\u200c/.test(body);
  if (message.key.fromMe && isCampaign) {
    const messageRecord = await Message.findOne({
      where: { id: message.key.id!, companyId }
    });
    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    await ticket.update({ status: "closed" });

    io.to("open").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.to(ticket.status)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

const wbotMessageListener = (wbot: Session, companyId: number): void => {
  wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
    if (!messageUpsert.messages) return;

    messageUpsert.messages.forEach(async (message: proto.IWebMessageInfo) => {
      const messageExists = await Message.count({
        where: { id: message.key.id!, companyId }
      });

      if (!messageExists) {
        await handleMessage(message, wbot, companyId);
        await verifyRecentCampaign(message, companyId);
        await verifyCampaignMessageAndCloseTicket(message, companyId);
      }
    });
  });

  wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
    if (messageUpdate.length === 0) return;
    messageUpdate.forEach(async (message: WAMessageUpdate) => {
      await handleMsgAck(message, message.update.status);
    });
  });
};

export { wbotMessageListener, handleMessage };

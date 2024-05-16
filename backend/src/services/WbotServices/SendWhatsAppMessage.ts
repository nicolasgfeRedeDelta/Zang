import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";

interface Request {
  body: any[];
  ticket: Ticket;
  quotedMsg?: Message;
}

const formateMessages = (msg) => {
  let messageFormated = [];
  let message = "";
  let timeEnv = 0;

  if (msg != null) {
    if (msg.message != null && msg.mediaUrl === null) {
      message = msg.message;
      timeEnv = msg.timeSendMessage * 1000;
    } else if (msg.mediaUrl != null && msg.message === null) {
      message = msg.mediaUrl;
      timeEnv = msg.timeSendMessage * 1000;
    } else if (msg.mediaUrl != null && msg.message != null) {
      message = msg.mediaUrl + `\n${msg.message}`;
      timeEnv = msg.timeSendMessage * 1000;
    }
  }
  messageFormated.push({ message: message, timeEnv: timeEnv });
  return messageFormated;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg
}: Request): Promise<any> => {
  try {
    let options = {};
    const wbot = await GetTicketWbot(ticket);
    const number = `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`;
    if (quotedMsg) {
      if (wbot.type === "md") {
        const chatMessages = await Message.findOne({
          where: {
            id: quotedMsg.id.toString()
          }
        });
        if (chatMessages) {
          const msgFound = JSON.parse(chatMessages.dataJson);
          options = {
            quoted: {
              key: msgFound.key,
              message: {
                extendedTextMessage: msgFound.message.extendedTextMessage
              }
            }
          };
        }
      }
    }
    const messagesToArray = Array.isArray(body) ? body : [body];
    const sentMessages = []
    if (messagesToArray) {//nesse if ele vai pegas as partes do body e verificar se e array ou nao
      for (const messages of messagesToArray) {// esses for pegam as mensagens e o tempo de aguardo para o enviop dela
        let formatedMessage = []
        if (messagesToArray.length == 1) {
          formatedMessage.push({ messages });
        } else {
          formatedMessage = formateMessages(messages);
        }

        for (const formatedMsg of formatedMessage) {
          let message: string
          typeof formatedMsg.messages === 'string' ? message = formatedMsg.messages : message = formatedMsg.messages.message;
          let timeSendMessage = formatedMsg.messages.timeSendMessage * 1000
          await new Promise(resolve => setTimeout(resolve, timeSendMessage));
          try {
            if (message === "") {
              throw new Error('message é vazio!');
            }
            const sentMessage = await wbot.sendMessage(
              number,
              {
                text: formatBody(message, ticket.contact)
              }, {
                ...options
              }
            );
            await ticket.update({ lastMessage: formatBody(message, ticket.contact) });
            return sentMessage;
          } catch (err) {
            Sentry.captureException(err);
            console.log(err);
            throw new AppError("ERR_SENDING_WAPP_MSG");
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
};

export default SendWhatsAppMessage;

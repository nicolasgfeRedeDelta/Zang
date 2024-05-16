import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import * as crypto from 'crypto';

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

let lestestMessageId: string;
const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {

  if (messageData.id == lestestMessageId) {//validação criada para corrigir bug de conversa entre zappfy que nao estava salvando corretamente as mansagens dos chat
    const newMessageId = crypto.randomBytes(15).toString('hex').toUpperCase();
    messageData.id = newMessageId.toString();
  }

  lestestMessageId = messageData.id
  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "queue"]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  if (message.ticket.isGroup === true && message.ticket.status === "pending") {
    await message.ticket.update(
      { status: "group" }
    );
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  return message;
};

export default CreateMessageService;

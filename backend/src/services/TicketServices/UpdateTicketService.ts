import moment from "moment";
import * as Sentry from "@sentry/node";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Setting from "../../models/Setting";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import QueuesSequenceUser from "../../models/QueuesSequenceUser";
import { bool } from "aws-sdk/clients/signer";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  chatbot?: boolean;
  queueOptionId?: number;
  contactId?: number;
  whatsappId?: number;
  accepModal?: bool
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;

}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}
let queueUserData = null

const validateFirstUser = async (usersData) => {
  let hasUsers: bool = false
  let alreadySetUser: bool = false
  usersData.QueuesSequenceUser.map(async (data, i) => {
    if (usersData.autoSelectUser) {
      if (data.currentUser == null) {
        hasUsers = true;
        if (alreadySetUser == false) {
          data.currentUser = true;
          alreadySetUser = true;
          await QueuesSequenceUser.update({ currentUser: false }, {
            where: {
              id: data.id
            }
          });
        }
      }
    }
  });
  queueUserData = usersData
  if (hasUsers == false) {
    usersData.QueuesSequenceUser.map(async (data, i) => {
      if (i == 0) {
        data.currentUser = true;
        await QueuesSequenceUser.update({ currentUser: false }, {
          where: {
            id: data.id
          }
        });
      } else {
        await QueuesSequenceUser.update({ currentUser: null }, {
          where: {
            id: data.id
          }
        });
      }
      queueUserData = usersData
    });
  }
}


const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {
  try {
    const { status } = ticketData;
    let { queueId, userId } = ticketData;
    let chatbot: boolean | null = ticketData.chatbot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    if (status === "open") {
      await CheckContactOpenTickets(ticketData.contactId, ticketData.whatsappId, ticketData.status);
    }

    const key = "userRating";
    const setting = await Setting.findOne({
      where: {
        companyId,
        key
      }
    });

    const ticket = await ShowTicketService(ticketId, companyId);
    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    await SetTicketMessagesAsRead(ticket);

    const oldStatus = ticket.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket.queueId;

    if (oldStatus === "closed") {
      await CheckContactOpenTickets(ticket.contact.id, ticket.whatsappId);
      chatbot = null;
      queueOptionId = null;
    }

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const { complationMessage, ratingMessage } = await ShowWhatsAppService(
        ticket.whatsappId,
        companyId
      );

      if (setting?.value === "enabled") {
        if (ticketTraking.ratingAt == null) {
          const ratingTxt = ratingMessage || "";
          let bodyRatingMessage = [];
          bodyRatingMessage.push(`\u200e${ratingTxt}\n\n` + "Digite de 1 à 3 para qualificar nosso atendimento:\n*1* - _Insatisfeito_\n*2* - _Satisfeito_\n*3* - _Muito Satisfeito_\n\n");
          await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });

          await ticketTraking.update({
            ratingAt: moment().toDate()
          });

          io.to("open")
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };
        }
        ticketTraking.ratingAt = moment().toDate();
        ticketTraking.rated = false;
      }

      if (!isNil(complationMessage) && complationMessage !== "") {
        const body = [];
        body.push(`\u200e${complationMessage}`)
        await SendWhatsAppMessage({ body, ticket });
      }

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;
    }

    if (queueId !== undefined && queueId !== null) {
      ticketTraking.queuedAt = moment().toDate();
    }

    if (oldQueueId !== queueId && !isNil(oldQueueId) && !isNil(queueId)) {
      const queue = await Queue.findByPk(queueId);
      let body = `\u200e${queue?.greetingMessage}`;

      const confirmationQueue = await Setting.findOne({
        where: {
          key: "transferMessageQueue",
          companyId: companyId
        }
      });

      if (confirmationQueue === null) {
        throw Error("Permissao de transferencia de mensagem nao identificada!");
      }

      if (confirmationQueue.value === "true") {
        const wbot = await GetTicketWbot(ticket);

        const queueChangedMessage = await wbot.sendMessage(
          `${ticket.contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"
          }`,
          {
            text: "\u200eVocê foi transferido, em breve iremos iniciar seu atendimento."
          }
        );
        await verifyMessage(queueChangedMessage, ticket, ticket.contact);
      }

      // mensagem padrão desativada em caso de troca de fila
      // const sentMessage = await wbot.sendMessage(`${ticket.contact.number}@c.us`, body);
      // await verifyMessage(sentMessage, ticket, ticket.contact, companyId);
    }
    
    const queue: any = await Queue.findByPk(queueId, {
      include: [
        {
          model: QueuesSequenceUser,
          as: "QueuesSequenceUser",
        }],
      order: [
        ["id", "ASC"]
      ]
    });
    let dataSetUserQueue = null
    
    if (queue != null) {
      validateFirstUser(queue)
      dataSetUserQueue = queueUserData
    }
    if (queueUserData != null) {
      queueUserData = null
      if (dataSetUserQueue != null && dataSetUserQueue.autoSelectUser == true) {
        queueUserData = null
        let ticketStatus: string
        let ticketUser: any
        dataSetUserQueue.QueuesSequenceUser.map(async (Sequence: any) => {
          if (ticketData.accepModal == true){
            ticketStatus = status
            ticketUser = userId
          }else{
            ticketStatus = "pending"
            ticketUser = Sequence.userId
          }
          if (Sequence.currentUser == true) {
            await ticket.update({
              status: ticketStatus,
              queueId,
              userId: ticketUser,
              chatbot,
              queueOptionId
            })
          }
        })
        queueUserData = null
      } else {
        await ticket.update({
          status,
          queueId,
          userId,
          chatbot,
          queueOptionId
        })
      }
    } else {
      await ticket.update({
        status,
        queueId,
        userId,
        chatbot,
        queueOptionId
      })
    };

    await ticket.reload();

    if (status !== undefined && ["pending"].indexOf(status) > -1) {
      ticketTraking.update({
        whatsappId: ticket.whatsappId,
        queuedAt: moment().toDate(),
        startedAt: null,
        userId: null
      });
    }

    if (status !== undefined && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }

    await ticketTraking.save();

    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
      io.to(oldStatus).emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
    }

    io.to(ticket.status)
      .to("notification")
      .to(ticketId.toString())
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    if (ticket.status === "chatbot") {
      io.emit(`company-${companyId}-ticket-chatbot`, {
        action: "updateListCount",
      });
    }
    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
    throw err
  }
};

export default UpdateTicketService;

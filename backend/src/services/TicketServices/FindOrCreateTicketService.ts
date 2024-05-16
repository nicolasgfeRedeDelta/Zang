import { subHours } from "date-fns";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import Queue from "../../models/Queue";
import { getIO } from "../../libs/socket";

interface TicketData {
  status?: string;
  companyId?: number;
  unreadMessages?: number;
}

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  companyId: number,
  groupContact?: Contact,
  queues?: Queue[],
  isCampaign?: boolean
): Promise<Ticket> => {
  const io = getIO();

  let whereCondition: any = {
    status: {
      [Op.or]: ["open", "pending", "chatbot"]
    },
    contactId: groupContact ? groupContact.id : contact.id,
    companyId: companyId 
  };
  
  if (whatsappId) {
    whereCondition.whatsappId = whatsappId;
  }
  
  let ticket = await Ticket.findOne({
    where: whereCondition,
    order: [["id", "DESC"]]
  });

  if (ticket) {
    await ticket.update({ unreadMessages });
  }

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        contactId: groupContact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        companyId
      });
      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }
  }

  if (!ticket && groupContact) {
    ticket = await Ticket.findOne({
      where: {
        updatedAt: {
          [Op.between]: [+subHours(new Date(), 2), +new Date()]
        },
        contactId: contact.id
      },
      order: [["updatedAt", "DESC"]]
    });

    if (ticket) {
      await ticket.update({
        status: "pending",
        userId: null,
        unreadMessages,
        companyId
      });
      await FindOrCreateATicketTrakingService({
        ticketId: ticket.id,
        companyId,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId
      });
    }
  }

  if (!ticket) {
    if (queues?.length > 1 && isCampaign == false) {
      const chatbot = queues.length > 0;

      ticket = await Ticket.create({
        contactId: groupContact ? groupContact.id : contact.id,
        status: groupContact ? "group" : chatbot ? "chatbot" : "pending",
        isGroup: !!groupContact,
        chatbot: groupContact ? false : chatbot,
        unreadMessages,
        whatsappId,
        companyId
      });

      if (ticket.status === "chatbot") {
        io.emit(`company-${companyId}-ticket-chatbot`, {
          action: "updateListCount",
        });
      }
    } else {
      ticket = await Ticket.create({
        contactId: groupContact ? groupContact.id : contact.id,
        status: "pending",
        isGroup: !!groupContact,
        unreadMessages,
        whatsappId,
        companyId
      });
    }

    await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId,
      userId: ticket.userId
    });
  }

  ticket = await ShowTicketService(ticket.id, companyId);

  return ticket;
};

export default FindOrCreateTicketService;

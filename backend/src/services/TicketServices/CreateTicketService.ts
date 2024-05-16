import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import ShowContactService from "../ContactServices/ShowContactService";
import { getIO } from "../../libs/socket";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  whatsappId: number;
  companyId: number;
  queueId?: number;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  whatsappId,
  queueId,
  companyId
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = whatsappId === null ? await GetDefaultWhatsApp(companyId): whatsappId;
  // const defaultWhatsapp = await GetDefaultWhatsApp(companyId);  

  await CheckContactOpenTickets(contactId, whatsappId);

  const { isGroup } = await ShowContactService(contactId, companyId);

  const { id } = await Ticket.create({
      contactId,
      companyId,
      // whatsappId: whatsappValue,
      whatsappId: defaultWhatsapp,
      status,
      isGroup,
      userId
  });

  await Ticket.update(
    { companyId, queueId, userId, status: "open", whatsappId: defaultWhatsapp },
    { where: { id } }
  );

  const ticket = await Ticket.findByPk(id, { include: ["contact", "queue"] });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  const io = getIO();

  io.to(ticket.id.toString()).emit("ticket", {
    action: "update",
    ticket
  });

  return ticket;
};

export default CreateTicketService;

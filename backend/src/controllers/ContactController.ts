import * as Yup from "yup";
import { Request, Response, response } from "express";
import { getIO } from "../libs/socket";

import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import UpdateContactService from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import GetContactService from "../services/ContactServices/GetContactService";

import CheckContactNumber from "../services/WbotServices/CheckNumber";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import AppError from "../errors/AppError";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ContactCustomField from "../models/ContactCustomField";
import ContactNote from "../models/ContactNote";
import Ticket from "../models/Ticket";
import { Op } from "sequelize";
import ListServiceCampaignIds from "../services/ContactServices/ListServiceCampaignIds";
import ListServiceCampaign from "../services/ContactServices/ListServiceCampaign";
import ListServiceCampaignByIds from "../services/ContactServices/ListServiceCampaignByIds";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type IndexQueryCampaign = {
  pageNumber: string;
  nameFilter: string;
  date: any;
  selectedQueueIds: string;
  status: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Notes extends ContactNote {
  note: string;
  userId: number;
}


interface ContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: ExtraInfo[];
  notes?: Notes[];
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ contacts, count, hasMore });
};

export const getContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user;

  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newContact: ContactData = req.body;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await CheckIsValidContact(newContact.number, companyId);
  const validNumber = await CheckContactNumber(newContact.number, companyId);
  const number = validNumber.jid.replace(/\D/g, "");
  newContact.number = number;

  /**
   * Código desabilitado por demora no retorno
   */
  // const profilePicUrl = await GetProfilePicUrl(validNumber.jid, companyId);

  const contact = await CreateContactService({
    ...newContact,
    // profilePicUrl,
    companyId
  });

  const ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending", "chatbot"]
      },
      contactId: contact.id,
      companyId
    },
    order: [["id", "DESC"]]
  });

  const io = getIO();

  if (ticket) {
    io.emit(`company-${companyId}-contact`, {
      action: "create",
      contact,
      ticketId: ticket.id
    });
  } else {
    io.emit(`company-${companyId}-contact`, {
      action: "create",
      contact,
    });
  }

  return res.status(200).json(contact);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(
      /^\d+$/,
      "Invalid number format. Only numbers is allowed."
    )
  });

  try {
    await schema.validate(contactData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await CheckIsValidContact(contactData.number, companyId);
  const validNumber = await CheckContactNumber(contactData.number, companyId);
  const number = validNumber.jid.replace(/\D/g, "");
  contactData.number = number;

  const { contactId } = req.params;

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-contact`, {
    action: "update",
    contact
  });

  return res.status(200).json(contact);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  await ShowContactService(contactId, companyId);

  await DeleteContactService(contactId);

  const io = getIO();
  io.emit(`company-${companyId}-contact`, {
    action: "delete",
    contactId
  });

  return res.status(200).json({ message: "Contact deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contacts = await SimpleListService({ name, companyId });

  return res.json(contacts);
};

export const listCampaing = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const {
    pageNumber,
    nameFilter,
    selectedQueueIds: selectedQueueIdsStringified,
    date,
    status: statusStrified
  } = req.query as IndexQueryCampaign;

  let selectedQueueIds: number[] = [];
  let status: boolean;

  if (selectedQueueIdsStringified) {
    for (const elemento of selectedQueueIdsStringified) {
      selectedQueueIds.push(parseInt(elemento, 10));
    }
  }

  if (statusStrified === "true") {
    status = true;
  } else if (statusStrified === "false") {
    status = false;
  }

  const respose = await ListServiceCampaign({ companyId, pageNumber, date: JSON.parse(date), status, selectedQueueIds, nameFilter });
  return res.json(respose);
};

export const listCampaingIds = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const {
    pageNumber,
    nameFilter,
    selectedQueueIds: selectedQueueIdsStringified,
    date,
    status: statusStrified
  } = req.query as unknown as IndexQueryCampaign;

  let selectedQueueIds: number[] = [];
  let status: boolean;

  if (selectedQueueIdsStringified) {
    for (const elemento of selectedQueueIdsStringified) {
      selectedQueueIds.push(parseInt(elemento, 10));
    }
  }

  if (statusStrified === "true") {
    status = true;
  }
  if (statusStrified === "false") {
    status = false;
  }

  const respose = await ListServiceCampaignIds({ companyId, date: JSON.parse(date), status, selectedQueueIds, nameFilter });
  return res.json(respose);
};

export const listContactsByIds = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body.ids;
  const { id } = req.params;
  const ids = data.split(',').map(Number);

  const respose = await ListServiceCampaignByIds({ companyId, ids, id });
  return res.json(respose);
};

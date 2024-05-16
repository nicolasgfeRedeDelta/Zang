import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";

import ContactNote from "../models/ContactNote";
import CreateContactNoteService from "../services/ContactNoteService/CreateContactNoteService";
import DeleteConatctNoteService from "../services/ContactNoteService/DeleteContactNoteService";
import FindNotesByContactId from "../services/ContactNoteService/FindNotesByContactId";


type StoreTicketNoteData = {
  note: string;
  userId: number;
  contactId: number;
  id?: number | string;
};

type QueryFilteredNotes = {
  contactId: number | string;
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newTicketNote: StoreTicketNoteData = req.body;
  const { id: userId } = req.user;

  const schema = Yup.object().shape({
    note: Yup.string().required()
  });

  try {
    await schema.validate(newTicketNote);
  } catch (err) {
    throw new AppError(err.message);
  }

  const ticketNote = await CreateContactNoteService({
    ...newTicketNote,
    userId
  });

  return res.status(200).json(ticketNote);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await DeleteConatctNoteService(id);

  return res.status(200).json({ message: "Observação removida" });
};

export const findFilteredList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { contactId } = req.query as QueryFilteredNotes;
    const notes: ContactNote[] = await FindNotesByContactId({
      contactId,
    });

    return res.status(200).json(notes);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
};

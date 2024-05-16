import * as Yup from "yup";
import AppError from "../../errors/AppError";
import ContactNote from "../../models/ContactNote";

interface ContactNoteData {
  note: string;
  userId: number | string;
  contactId: number | string;
}

const CreateContactNoteService = async (
  contactNoteData: ContactNoteData
): Promise<ContactNote> => {
  const { note } = contactNoteData;

  const contactnoteSchema = Yup.object().shape({
    note: Yup.string()
      .min(3, "ERR_CONTACTNOTE_INVALID_NAME")
      .required("ERR_CONTACTNOTE_INVALID_NAME")
  });

  try {
    await contactnoteSchema.validate({ note });
  } catch (err) {
    throw new AppError(err.message);
  }

  const ticketNote =  await ContactNote.create(contactNoteData);

  return ticketNote;
};

export default CreateContactNoteService;

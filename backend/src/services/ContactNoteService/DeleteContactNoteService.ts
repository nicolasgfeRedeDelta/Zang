import AppError from "../../errors/AppError";
import ContactNote from "../../models/ContactNote";

const DeleteConatctNoteService = async (id: string): Promise<void> => {
  const contactNote = await ContactNote.findOne({
    where: { id }
  });

  if (!contactNote) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  await contactNote.destroy();
};

export default DeleteConatctNoteService;

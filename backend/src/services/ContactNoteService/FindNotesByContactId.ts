import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ContactNote from "../../models/ContactNote";

interface Params {
  contactId: number | string;
}

const FindNotesByContactId = async ({
  contactId,
}: Params): Promise<ContactNote[]> => {
  const notes: ContactNote[] = await ContactNote.findAll({
    where: {
      contactId,
    },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Contact, as: "contact", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]]
  });

  return notes;
};

export default FindNotesByContactId;

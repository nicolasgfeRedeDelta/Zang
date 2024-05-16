import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import ContactNote from "../../models/ContactNote";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Notes extends ContactNote {
  note: string;
  userId: number;
}

interface Request {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  notes?: Notes[];
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  companyId,
  extraInfo = [],
  notes = [],
}: Request): Promise<Contact> => {
  const numberExists = await Contact.findOne({
    where: { number, companyId }
  });

  if (numberExists) {
    throw new AppError("ERR_DUPLICATED_CONTACT");
  }

  const contact = await Contact.create(
    {
      name,
      number,
      email,
      extraInfo,
      notes,
      companyId
    },
    {
      include: ["extraInfo", "notes"]
    }
  );

  return contact;
};

export default CreateContactService;

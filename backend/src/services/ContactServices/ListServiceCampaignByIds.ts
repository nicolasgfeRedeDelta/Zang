import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { Op, FindOptions } from 'sequelize';
import CreateService from "../ContactListItemService/CreateService";

export interface SearchContactParams {
  companyId: number;
  ids: number[];
  id: string;
}

interface ContactResponse {
  name: string,
  number: string,
  email: string,
}
const ListServiceCampaignByIds = async ({ companyId, ids, id }: SearchContactParams): Promise<ContactResponse[]> => {
  let options: FindOptions = {};

  options.where = {
    id: {
      [Op.in]: ids
    }
  };

  const contacts = await Contact.findAll({
    attributes: ["id", "name", "email", "number"],
    where: options.where,
  });

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }
  contacts.map((value) => {
    try {
      CreateService({
        email: value.email,
        companyId: companyId,
        number: value.number,
        contactListId: Number(id),
        name: value.name
      })
    } catch (error) {
      console.log("Não criou o ->", value.name);
      console.log(error.message);
    }
  })

  return contacts;
};

export default ListServiceCampaignByIds;

import { Op, Filterable, Includeable } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";

interface Request {
  pageNumber?: string;
  updatedAt?: string;
  userId: string;
  companyId: number;
  contactId: string;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsServiceContact = async ({
  pageNumber = "1",
  updatedAt,
  userId,
  companyId,
  contactId
}: Request): Promise<Response> => {
  let includeCondition: Includeable[];
  let whereCondition: Filterable["where"];

  const user = await User.findByPk(userId, {
    attributes: [
      "name",
      "id",
      "email",
      "companyId",
      "profile",
      "viewMessage",
      "group",
      "editQueue",
      "viewChatbot",
      "super",
      "tokenVersion"
    ],
  });

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "profilePicUrl"]
    }
  ];

  if (contactId) {
    whereCondition = {
      ...whereCondition,
      contactId: contactId
    }
  }

  if (updatedAt) {
    whereCondition = {
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    companyId
  };

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: true,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false
  });

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsServiceContact;

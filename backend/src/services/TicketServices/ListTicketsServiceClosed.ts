import { Filterable, Includeable } from "sequelize";

import Ticket from "../../models/Ticket";
import { like } from "sequelize/types/lib/operators";
import Contact from "../../models/Contact";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Tag from "../../models/Tag";

interface Request {
  pageNumber: string;
  contactId: string;
  companyId: number;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsServiceClosed = async ({
  pageNumber = "1",
  contactId,
  companyId,
}: Request): Promise<Response> => {
  let includeCondition: Includeable[];
  let whereCondition: Filterable["where"];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "profilePicUrl"]
    }, {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    }, {
      model: User,
      as: "user",
      attributes: ["id", "name", "group"]
    }, {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    }
  ];
  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    contactId: parseInt(contactId)
  }

  whereCondition = {
    ...whereCondition,
    companyId
  };

  whereCondition = {
    ...whereCondition,
    status: "closed"
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

export default ListTicketsServiceClosed;

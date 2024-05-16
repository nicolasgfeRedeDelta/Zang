import { Filterable } from "sequelize";
import Ticket from "../../models/Ticket";

interface Request {
  status: string;
  companyId: number;
}

interface Response {
  count: number;
}

const ListTicketsCountService = async ({
  status,
  companyId
}: Request): Promise<Response> => {
  let whereCondition: Filterable["where"];

  if (status) {
    whereCondition = {
      ...whereCondition,
      status
    };
  }

  whereCondition = {
    ...whereCondition,
    companyId
  };

  const { count } = await Ticket.findAndCountAll({
    where: whereCondition,
  });

  return { count };
};

export default ListTicketsCountService;

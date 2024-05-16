import { Op } from "sequelize";
import QueueOption from "../../models/QueueOption";

const ListChatBotService = async (): Promise<QueueOption[]> => {
  const chatBot = await QueueOption.findAll({
    where: {
      queueId: {
        [Op.or]: [null]
      }
    },
    order: [["id", "ASC"]]
  });

  return chatBot;
};

export default ListChatBotService;

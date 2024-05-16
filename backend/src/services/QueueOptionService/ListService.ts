import { WhereOptions } from "sequelize/types";
import QueueOption from "../../models/QueueOption";

type QueueOptionFilter = {
  queueId: string | number;
  queueOptionId: string | number;
  chatbotId: string | number | boolean;
  agentId: string | number;
};

const ListService = async ({ queueId, queueOptionId, chatbotId, agentId }: QueueOptionFilter): Promise<QueueOption[]> => {

  const whereOptions: WhereOptions = {};

  if (queueId) {
    whereOptions.queueId = queueId;
  }

  if (queueOptionId) {
    whereOptions.id = queueOptionId;
  }

  if (chatbotId == -1) {
    whereOptions.chatbotId = null;
  }

  // if (chatbotId > 0) {
  //   whereOptions.chatbotId = chatbotId;
  // }

  if (agentId) {
    whereOptions.agentId = agentId;
  }

  const queueOptions = await QueueOption.findAll({
    where: whereOptions,
    order: [["id", "ASC"]]
  });

  return queueOptions;
};

export default ListService;

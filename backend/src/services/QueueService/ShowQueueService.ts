import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";
import QueuesSequenceUser from "../../models/QueuesSequenceUser";
import User from "../../models/User";

const ShowQueueService = async (
  queueId: number | string,
  companyId: number
): Promise<Queue> => {
  const queue = await Queue.findByPk(queueId, {
    include: [
      {
        model: QueueOption,
        as: "chatbots",
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            separate: true,
            order: [['id', 'ASC']],
          }
        ]
      },
      {
        model: QueuesSequenceUser,
        as: "QueuesSequenceUser",
        separate: true,
        order: [['id', 'ASC']],
      }],
    order: [
      [{ model: QueueOption, as: "chatbots" }, "id", "asc"],
      ["id", "ASC"]
    ]
  });

  if (queue?.companyId !== companyId) {
    throw new AppError("Não é possível consultar registros de outra empresa");
  }

  if (!queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND");
  }

  return queue;
};

export default ShowQueueService;

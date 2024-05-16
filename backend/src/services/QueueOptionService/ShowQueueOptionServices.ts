import { addAttribute } from "sequelize-typescript";
import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";

const ShowQueueOptionServices = async (id: number | string): Promise<QueueOption> => {
  const queue = await QueueOption.findOne({
    where: {
      id
    },
    order: [
      [{ model: QueueOption, as: "mainChatbot" }, "id", "ASC"],
      [{ model: QueueOption, as: "options" }, "id", "ASC"],
      ["id", "asc"]
    ],
    include: [
      {
        model: QueueOption,
        as: "mainChatbot",
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
        model: QueueOption,
        as: "options",
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            separate: true,
            order: [['id', 'ASC']],
          }
        ]
      },
    ]
  });

  if (!queue) { 
    throw new AppError("Chatbot not found", 404);
  }

  return queue;
};

export default ShowQueueOptionServices;

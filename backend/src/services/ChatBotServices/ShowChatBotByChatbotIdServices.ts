import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";

const ShowChatBotByChatbotIdServices = async (
  chatbotId: number | string
): Promise<QueueOption> => {
  const queue = await QueueOption.findOne({
    where: { chatbotId },
    include: [
      {
        model: QueueOption,
        as: "mainChatbot",
        attributes: ["id", "title", "message"],
        order: [[{ model: QueueOption, as: "mainChatbot" }, "id", "ASC"]]
      },
      {
        model: QueueOption,
        as: "options",
        order: [[{ model: QueueOption, as: "options" }, "id", "ASC"]],
        attributes: ["id", "title", "message"]
      }
    ],
    order: [["id", "asc"]]
  });

  if (!queue) {
    throw new AppError("ERR_CHATBOT_NOT_FOUND_SERVICE", 404);
  }

  return queue;
};

export default ShowChatBotByChatbotIdServices;

import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";

const ShowChatBotByChatbotIdServices = async (
  chatbotId: number | string
): Promise<QueueOption> => {
  const queue = await QueueOption.findOne({
    where: { chatbotId },
    include: [
      {
        model: QueueOption,
        as: "mainChatbot",
        attributes: ["id", "title"],
        order: [[{ model: QueueOption, as: "mainChatbot" }, "id", "ASC"]],
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            separate: true,
            attributes: ["id" ,"mediaUrl", "message", "timeSendMessage", "mimetype"],
            order: ["id"]
          }
        ],
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

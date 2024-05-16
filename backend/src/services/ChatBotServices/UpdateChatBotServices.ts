import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";

interface ChatbotData {
  id?: number;
  title?: string;
  message?: string;
  options: QueueOption[];
}

const UpdateChatBotServices = async (
  chatBotId: number | string,
  chatbotData: ChatbotData
): Promise<QueueOption> => {
  const { options } = chatbotData;

  const chatbot = await QueueOption.findOne({
    where: { id: chatBotId },
    include: ["options"],
    order: [["id", "asc"]]
  });

  if (!chatbot) {
    throw new AppError("ERR_NO_CHATBOT_FOUND", 404);
  }

  if (options) {
    await Promise.all(
      options.map(async bot => {
        await QueueOption.upsert({ ...bot, chatbotId: chatbot.id });
      })
    );

    await Promise.all(
      chatbot.options.map(async oldBot => {
        const stillExists = options.findIndex(bot => bot.id === oldBot.id);

        if (stillExists === -1) {
          await QueueOption.destroy({ where: { id: oldBot.id } });
        }
      })
    );
  }

  await chatbot.update(chatbotData);

  await chatbot.reload({
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

  return chatbot;
};

export default UpdateChatBotServices;

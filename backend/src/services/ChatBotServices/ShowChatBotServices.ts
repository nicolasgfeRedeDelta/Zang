import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";

const ShowChatBotServices = async (id: number | string): Promise<QueueOption> => {
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
        as: "mainChatbot"
      },
      {
        model: QueueOption,
        as: "options"
      }
    ]
  });

  if (!queue) {
    throw new AppError("QueueOption not found", 404);
  }

  return queue;
};

export default ShowChatBotServices;

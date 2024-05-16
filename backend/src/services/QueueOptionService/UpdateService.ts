import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";
import ShowService from "./ShowService";

interface IMessagesQueueOption extends QueueOptionMessageResponses {
  message: string;
  mediaUrl: string;
}
interface QueueData {
  queueId?: string;
  title?: string;
  options?: QueueOption[];
  option?: string;
  messages?: IMessagesQueueOption[];
  chatbotId?: string;
}

const UpdateService = async (
  queueOptionId: number | string,
  queueOptionData: QueueData
): Promise<QueueOption> => {
  const { options } = queueOptionData;

  const queueOption = await QueueOption.findOne({
    where: { id: queueOptionId },
    include: [{
      model: QueueOption,
      as: "options",
      include: [
        {
          model: QueueOptionMessageResponses,
          as: "messages",
          attributes: ["id", "message", "mediaUrl", "queueOptionId", "mimetype"],
        },
      ],
    }],
    order: [["id", "asc"]]
  });

  if (!queueOption) {
    throw new AppError("ERR_NO_CHATBOT_FOUND", 404);
  }

  let hasMessages = false
  if (options) {
    await Promise.all(
      options.map(async bot => {
        await QueueOption.upsert({ ...bot, chatbotId: queueOption.id });
      })
    );

    await Promise.all(
      queueOption.options.map(async oldBot => {
        const stillExists = options.findIndex(bot => bot.id === oldBot.id);

        if (stillExists === -1) {
          await QueueOption.destroy({ where: { id: oldBot.id } });
        }
      })
    );
  }

  if (queueOptionData.options) {
    let messages = []
    await Promise.all(
      options.map(async (msgs: any) => {
        if (msgs.messages != undefined) {
          msgs.messages.map(async (msg: any) => {
            messages.push(msg)
            await QueueOptionMessageResponses.upsert({ ...msg, queueOptionId: msgs.id });
          })
        }
      })
    );

    await Promise.all(
      queueOption.options.map(async opt => {
        opt.messages.map(async oldMsg => {
          const stillExists = messages.findIndex(msg => msg.id === oldMsg.id);

          if (stillExists === -1) {
            await QueueOptionMessageResponses.destroy({ where: { id: oldMsg.id } });
          }
        })
      })
    );
  }


  await queueOption.update(queueOptionData);

  await queueOption.reload({
    include: [
      {
        model: QueueOption,
        as: "mainChatbot",
        attributes: ["id", "title"],
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            attributes: ["id", "message"]
          }
        ], order: [[{ model: QueueOption, as: "mainChatbot" }, "id", "ASC"]]
      },
      {
        model: QueueOption,
        as: "options",
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            attributes: ["id", "message"]
          }
        ],
        order: [[{ model: QueueOption, as: "options" }, "id", "ASC"]],
        attributes: ["id", "title"]
      }
    ],
    order: [["id", "asc"]]
  });

  return queueOption;
};

export default UpdateService;

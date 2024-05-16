import { Op } from "sequelize";
import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import ShowQueueService from "./ShowQueueService";
import QueueOptionMessageResponses from "../../models/QueueOptionMessageReponse";
import UserQueue from "../../models/UserQueue";
import QueuesSequenceUser from "../../models/QueuesSequenceUser";
import { Bool } from "aws-sdk/clients/clouddirectory";

interface QueueData {
  name?: string;
  color?: string;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  schedules?: any[];
  chatbots?: QueueOption[];
  QueuesSequenceUser?: any[];
  autoSelectUser?: Bool;
  queueSequenceId?: any[];
}

const UpdateQueueService = async (
  queueId: number | string,
  queueData: QueueData,
  companyId: number
): Promise<Queue> => {
  const { color, name, chatbots } = queueData;

  const queueSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_QUEUE_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_QUEUE_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameName = await Queue.findOne({
              where: { name: value, id: { [Op.ne]: queueId }, companyId }
            });

            return !queueWithSameName;
          }
          return true;
        }
      ),
    color: Yup.string()
      .required("ERR_QUEUE_INVALID_COLOR")
      .test("Check-color", "ERR_QUEUE_INVALID_COLOR", async value => {
        if (value) {
          const colorTestRegex = /^#[0-9a-f]{3,6}$/i;
          return colorTestRegex.test(value);
        }
        return true;
      })
      .test(
        "Check-color-exists",
        "ERR_QUEUE_COLOR_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameColor = await Queue.findOne({
              where: { color: value, id: { [Op.ne]: queueId }, companyId }
            });
            return !queueWithSameColor;
          }
          return true;
        }
      )
  });

  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }


  try {
    await queueSchema.validate({ color, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const queue = await ShowQueueService(queueId, companyId);

  if (queue.companyId !== companyId) {
    throw new AppError("Não é permitido alterar registros de outra empresa");
  }

  if (chatbots) {
    await Promise.all(
      chatbots.map(async bot => {
        await QueueOption.upsert({ ...bot, queueId: queue.id });
      })
    );

    await Promise.all(
      queue.chatbots.map(async oldBot => {
        const stillExists = chatbots.findIndex(bot => bot.id === oldBot.id);

        if (stillExists === -1) {
          await QueueOption.destroy({ where: { id: oldBot.id } });
        }
      })
    );
  }

  try {
    if (queueData.chatbots) {
      let messages = []
      await Promise.all(
        chatbots.map(async (msgs: any) => {
          if (msgs.messages != undefined) {
            msgs.messages.map(async (msg: any) => {
              messages.push(msg)
              await QueueOptionMessageResponses.upsert({ ...msg, queueOptionId: msgs.id });
            })
          }
        })
      );

      await Promise.all(
        queue.chatbots.map(async opt => {
          opt.messages.map(async oldMsg => {
            const stillExists = messages.findIndex(msg => msg.id === oldMsg.id);

            if (stillExists === -1) {
              await QueueOptionMessageResponses.destroy({ where: { id: oldMsg.id } });
            }
          })
        })
      );
    }
  } catch (error) {
    console.error(error)
  }

  try {
    if (queueData.QueuesSequenceUser) {
      let userData = []
      const queue = Number(queueId);
        for (let i = 0; i < queueData.QueuesSequenceUser.length; i++) {
          const queueUser = queueData.QueuesSequenceUser[i];
          userData.push(queueUser);
          sleep(150);
          await QueuesSequenceUser.upsert({ queueId: queue, userId: queueUser });
        }
      delete queueData.QueuesSequenceUser;

      await Promise.all(
        queueData.queueSequenceId.map(async queueUserId => {
          let ququeUsers = await QueuesSequenceUser.findByPk(queueUserId);
          let stillExists: number;
          if (ququeUsers.id) {
            stillExists = -1
          }
          if (stillExists === -1) {
            await QueuesSequenceUser.destroy({ where: { id: queueUserId } });
          }
        })
      );
    }
  } catch (error) {
    console.error(error)
  }

  await queue.update(queueData);

  await queue.reload({
    attributes: ["id", "color", "name", "greetingMessage"],
    include: [
      {
        model: QueueOption,
        as: "chatbots",
        include: [
          {
            model: QueueOptionMessageResponses,
            as: "messages",
            attributes: ["id", "mediaUrl", "message", "timeSendMessage", "mimetype"],
            separate: true,
            order: [['id', 'ASC']]
          },
        ],
        attributes: ["id", "title", "isAgent", "agentId"],
        order: [[{ model: QueueOption, as: "chatbots" }, "id", "asc"], ["id", "ASC"]]
      }
    ],
    order: [[{ model: QueueOption, as: "chatbots" }, "id", "asc"], ["id", "ASC"]]
  });

  return queue;
};

export default UpdateQueueService;

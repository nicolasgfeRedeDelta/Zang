import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";
import QuickMessageResponse from "../../models/QuickMessageResponse";
import QuickMessageModules from "../../models/QuickMessageModules";

interface IMessagesQuickMessage extends QuickMessageResponse {
  message: string;
  mediaUrl: string;
  timeSendMessage: number;
}

interface Data {
  color: string,
  shortcode: string;
  messages: IMessagesQuickMessage[];
  userId: number | string;
  id?: number | string;
  modules: string[];
}


const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, color, shortcode, messages, userId, modules } = data;

  const record = await QuickMessage.findOne({
    where: { id: id },
    attributes: [ "id", "color", "shortcode", "userId"],
    include: [
      {
        model: QuickMessageResponse,
        as: "messages",
      },
      {
        model: QuickMessageModules,
        as: "modules",
        attributes: ["id", "modules"]
      }
    ]
  });

  if (!record) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  if (messages) {
    await Promise.all(
      messages.map(async (msg: any, index) => {
        await QuickMessageResponse.upsert({ ...msg, quickMessageId: record.id });
      })
    );

    await Promise.all(
      record.messages.map(async oldMsg => {
        const stillExists = messages.findIndex(msg => msg.id === oldMsg.id);

        if (stillExists === -1) {
          await QuickMessageResponse.destroy({ where: { id: oldMsg.id } });
        }
      })
    );
  }

  if (modules) {
    await Promise.all(
      modules.map(async (module: any, index) => {
        await QuickMessageModules.upsert({ modules: module, quickMessageId: record.id });
      })
    );

    await Promise.all(
      record.modules.map(async oldModule => {
        const stillExists = messages.findIndex(module => module.id === oldModule.id);

        if (stillExists === -1) {
          await QuickMessageModules.destroy({ where: { id: oldModule.id } });
        }
      })
    );
  }

  await record.update({
    
    color,
    shortcode,
    messages,
    userId,
    modules
  });

  return record;
};

export default UpdateService;

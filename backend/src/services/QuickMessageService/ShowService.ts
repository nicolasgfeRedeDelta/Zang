import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";
import QuickMessageResponse from "../../models/QuickMessageResponse";
import QuickMessageModules from "../../models/QuickMessageModules";

const ShowService = async (id: string | number): Promise<QuickMessage> => {
  const record = await QuickMessage.findByPk(id, {
    include: [
      {
        model: QuickMessageResponse,
        as: "messages",
      },
      {
        model: QuickMessageModules,
        as: "modules",
        attributes: ["id","modules"]
      }
    ]
  });

  if (!record) {
    throw new AppError("ERR_NO_TICKETNOTE_FOUND", 404);
  }

  return record;
};

export default ShowService;

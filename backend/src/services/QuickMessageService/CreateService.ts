import * as Yup from "yup";
import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";
import QuickMessageResponse from "../../models/QuickMessageResponse";
import QuickMessageModules from "../../models/QuickMessageModules";

interface IMessagesQuickMessage extends QuickMessageResponse {
  message: string;
  mediaUrl: string;
}
interface Data {
  color:string;
  shortcode: string;
  companyId: number | string;
  userId: number | string;
  messages: IMessagesQuickMessage[];
  modules: string[];
}

const CreateService = async (data: Data): Promise<QuickMessage> => {
  const { color, shortcode, messages, modules } = data;

  const ticketnoteSchema = Yup.object().shape({
    color: Yup.string()
      .required("ERR_QUICKMESSAGE_REQUIRED"),
    shortcode: Yup.string()
      .min(3, "ERR_QUICKMESSAGE_INVALID_NAME")
      .required("ERR_QUICKMESSAGE_REQUIRED")
  });

  try {
    await ticketnoteSchema.validate({ color, shortcode, messages, modules });

    const record = await QuickMessage.create(data,
      {
        include: [
          {
            model: QuickMessageResponse,
            as: "messages",
          }, {
            model: QuickMessageModules,
            as: "modules",
          }
        ]
      }
    );
    return record;
  } catch (err: any) {
    throw new AppError(err);
  }

};

export default CreateService;

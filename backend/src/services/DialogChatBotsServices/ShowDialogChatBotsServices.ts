import DialogChatBots from "../../models/DialogChatBots";
import QueueOption from "../../models/QueueOption";

const ShowDialogChatBotsServices = async (
  contactId: number | string,
  companyId: number
): Promise<DialogChatBots | void> => {
  const dialog = await DialogChatBots.findOne({
    where: {
      contactId
    },
    include: [
      {
        model: QueueOption,
        as: "chatbots",
        order: [[{ model: QueueOption, as: "chatbots" }, "id", "ASC"]]
      }
    ]
  });

  return dialog;
};

export default ShowDialogChatBotsServices;

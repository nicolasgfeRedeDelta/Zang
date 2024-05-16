import QueueOption from "../../models/QueueOption";


interface ChatbotData {
  name: string;
  color: string;
  greetingMessage?: string;
}

const CreateChatBotServices = async (
  chatBotData: ChatbotData
): Promise<QueueOption> => {
  const chatBot = await QueueOption.create(chatBotData);
  return chatBot;
};

export default CreateChatBotServices;

import { WASocket, proto } from "@whiskeysockets/baileys";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import { Store } from "../../libs/store";
import { getBodyMessage, verifyMessage } from "./wbotMessageListener";
import ShowQueueService from "../QueueService/ShowQueueService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import formatBody from "../../helpers/Mustache";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import User from "../../models/User";
import Setting from "../../models/Setting";
import DeleteDialogChatBotsServices from "../DialogChatBotsServices/DeleteDialogChatBotsServices";
import ShowChatBotByChatbotIdServices from "../QueueOptionService/ShowQueueOptionByChatbotIdServices";
import CreateDialogChatBotsServices from "../DialogChatBotsServices/CreateDialogChatBotsServices";
import QueueOption from "../../models/QueueOption";
import ShowDialogChatBotsServices from "../DialogChatBotsServices/ShowDialogChatBotsServices";
import ShowQueueOptionServices from "../QueueOptionService/ShowQueueOptionServices";
import { logger } from "../../utils/logger";

type Session = any & {
  id?: number;
  store?: Store;
};

const isNumeric = (value: string) => /^-?\d+$/.test(value);

export const deleteAndCreateDialogStage = async (
  contact: Contact,
  chatbotId: number,
  ticket: Ticket,
  newChatbotId?: number,
) => {
  try {
    await DeleteDialogChatBotsServices(contact.id);
    const bots = await ShowChatBotByChatbotIdServices(chatbotId);
    if (!bots) {
      await ticket.update({ isBot: false });
    }

    if (newChatbotId) {
      chatbotId = newChatbotId;
    }

      bots.queueId = ticket.queueId;

    return await CreateDialogChatBotsServices({
      awaiting: 1,
      contactId: contact.id,
      chatbotId,
      queueId: bots.queueId
    });
  } catch (error) {
    await ticket.update({ isBot: false });
  }
};

const sendMessage = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  body: string
) => {
  try {
    const sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody(body, contact)
      }
    );
    verifyMessage(sentMessage, ticket, contact);
  } catch (error) {
    logger.error(error)
  }
};

export const sendDialog = async (
  choosenQueue: QueueOption,
  wbot: Session,
  contact: Contact,
  ticket: Ticket
) => {
  const showChatBots = await ShowQueueOptionServices(choosenQueue.id);
  if (showChatBots.options) {

    const buttonActive = await Setting.findOne({
      where: {
        key: "chatBotType",
        companyId: ticket.companyId
      }
    });

    const botText = async () => {
      let options = "";

      showChatBots.options.forEach((option, index) => {
        options += `*${index + 1}* - ${option.title}\n`;
      });

      const optionsBack =
        options.length > 0
          ? `${options}\n*#* Voltar para o menu principal`
          : options;

      if (options.length > 0) {
        const body = `\u200e${choosenQueue.messages}\n\n${optionsBack}`;
        const sendOption = await sendMessage(wbot, contact, ticket, body);
        return sendOption;
      }

      const body = `\u200e${choosenQueue.messages}`;
      const send = await sendMessage(wbot, contact, ticket, body);
      return send;
    };

    const botButton = async () => {
      const buttons = [];
      showChatBots.options.forEach((option, index) => {
        buttons.push({
          buttonId: `${index + 1}`,
          buttonText: { displayText: option.title },
          type: 1
        });
      });

      if (buttons.length > 0) {

      const buttonMessage = {
        text: `\u200e${choosenQueue.messages}`,
        buttons,
        headerType: 1
      };

      const send = await wbot.sendMessage(
        `${contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
        buttonMessage
      );

      await verifyMessage(send, ticket, contact);

      return send;
      }

      const body = `\u200e${choosenQueue.messages}`;
      const send = await sendMessage(wbot, contact, ticket, body);

      return send;

    };

    const botList = async () => {
      try {
        const sectionsRows = [];
        showChatBots.options.forEach((queue, index) => {
          sectionsRows.push({
            title: queue.title,
            rowId: `${index + 1}`
          });
        });

        if (sectionsRows.length > 0) {
          const sections = [
            {
              title: "Menu",
              rows: sectionsRows
            }
          ];

          const listMessage = {
            text: formatBody(`\u200e${choosenQueue.messages}`, contact),
            buttonText: "Escolha uma opção",
            sections
          };

          if (listMessage.text === "") {
            throw new Error("listMessage é vazio!!")
          }

          const sendMsg = await wbot.sendMessage(
            `${contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
            listMessage
          );

          await verifyMessage(sendMsg, ticket, contact);

          return sendMsg;
        }

        const body = `\u200e${choosenQueue.messages}`;
        const send = await sendMessage(wbot, contact, ticket, body);

        return send;
      } catch (error) {
        logger.error(error);
      }
    };

    if (buttonActive.value === "text") {
      return await botText();
    }

    if (buttonActive.value === "button" && showChatBots.options.length > 4) {
      return await botText();
    }

    if (buttonActive.value === "button" && showChatBots.options.length <= 4) {
      return await botButton();
    }

    if (buttonActive.value === "list") {
      return await botList();
    }
  }
};

const backToMainMenu = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  companyId?: number
) => {
  await UpdateTicketService({
    ticketData: { queueId: null },
    ticketId: ticket.id,
    companyId
  });

  const { queues, greetingMessage } = await ShowWhatsAppService(wbot.id!, companyId);

  const buttonActive = await Setting.findOne({
    where: {
      key: "chatBotType",
      companyId: companyId
    }
  });

  const botText = async () => {
    let options = "";

    queues.forEach((option, index) => {
      options += `*${index + 1}* - ${option.name}\n`;
    });

    const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, contact);
    await sendMessage(wbot, contact, ticket, body);

    const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
    return deleteDialog;
  };

  const botButton = async () => {
    const buttons = [];
    queues.forEach((queue, index) => {
      buttons.push({
        buttonId: `${index + 1}`,
        buttonText: { displayText: queue.name },
        type: 1
      });
    });

    const buttonMessage = {
      text: formatBody(`\u200e${greetingMessage}`, contact),
      buttons,
      headerType: 1
    };

    const sendMsg = await wbot.sendMessage(
      `${contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
      buttonMessage
    );

    await verifyMessage(sendMsg, ticket, contact);

    const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
    return deleteDialog;
  };

  const botList = async () => {
    try {
      const sectionsRows = [];
      queues.forEach((queue, index) => {
        sectionsRows.push({
          title: queue.name,
          rowId: `${index + 1}`
        });
      });

      const sections = [
        {
          title: "Menu",
          rows: sectionsRows
        }
      ];

      const listMessage = {
        text: formatBody(`\u200e${greetingMessage}`, contact),
        buttonText: "Escolha uma opção",
        sections
      };

      if (listMessage.text === "") {
        throw new Error("listMessage é vazio!")
      }

      const sendMsg = await wbot.sendMessage(
        `${contact.number}${ticket.isGroup ? "" : "@s.whatsapp.net"}`,
        listMessage
      );

      await verifyMessage(sendMsg, ticket, contact);

      const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
      return deleteDialog;
    } catch (error) {
      logger.error(error);
    }
  };

  if (buttonActive.value === "text") {
    return await botText();
  }

  if (buttonActive.value === "button" && queues.length > 4) {
    return await botText();
  }

  if (buttonActive.value === "button" && queues.length <= 4) {
    return await botButton();
  }

  if (buttonActive.value === "list") {
    return await botList();
  }
};

export const sayChatbot = async (
  queueId: number,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  companyId: number,
  msg: proto.IWebMessageInfo
): Promise<any> => {
  const selectedOption =
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    getBodyMessage(msg);

  if (!queueId && selectedOption && msg.key.fromMe) return;

  const getStageBot = await ShowDialogChatBotsServices(contact.id, companyId);

  if (selectedOption === "#") {
    const backTo = await backToMainMenu(wbot, contact, ticket);
    return backTo;
  }

  if (!getStageBot) {
    const queue = await ShowQueueService(queueId, companyId);

    const selectedOption =
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
      getBodyMessage(msg);

    const choosenQueue = queue.chatbots[+selectedOption - 1];

    if (!choosenQueue?.messages) {
      await DeleteDialogChatBotsServices(contact.id);
      return;
    } // nao tem mensagem de boas vindas
    if (choosenQueue) {
      if (choosenQueue.isAgent) {
        try {
          const getUserByName = await User.findOne({
            where: {
              name: choosenQueue.title
            }
          });
          const ticketUpdateAgent = {
            ticketData: {
              userId: getUserByName.id,
              status: "open"
            },
            ticketId: ticket.id,
            companyId: ticket.companyId
          };
          await UpdateTicketService(ticketUpdateAgent);
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }
      await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
      const send = await sendDialog(choosenQueue, wbot, contact, ticket);
      return send;
    }
  }

  if (getStageBot) {
    const selected = isNumeric(selectedOption) ? selectedOption : 1;
    const bots = await ShowQueueOptionServices(getStageBot.chatbotId);
    console.log("getStageBot", selected);

    const choosenQueue = bots.options[+selected - 1]
      ? bots.options[+selected - 1]
      : bots.options[0];

      console.log("choosenQueue", choosenQueue);

    if (!choosenQueue.messages) {
      await DeleteDialogChatBotsServices(contact.id);
      return;
    } // nao tem mensagem de boas vindas
    if (choosenQueue) {
      if (choosenQueue.isAgent) {
        const getUserByName = await User.findOne({
          where: {
            name: choosenQueue.title
          }
        });
        const ticketUpdateAgent = {
          ticketData: {
            userId: getUserByName.id,
            status: "open"
          },
          ticketId: ticket.id,
          companyId: ticket.companyId
        };
        await UpdateTicketService(ticketUpdateAgent);
      }
      await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
      const send = await sendDialog(choosenQueue, wbot, contact, ticket);
      return send;
    }
  }
};

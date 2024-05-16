import { Op, QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkUpdate("Settings", { key: "chatBotType" }, { key: { [Op.like]: "typeChatbot" } })
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkUpdate("Settings", { key: "typeChatbot" }, { key: { [Op.like]: "chatBotType" } })
  }
};

import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const query = `select id from "Whatsapps" w where "isDefault" = true or status = 'CONNECTED' limit 1`;
    const { QueryTypes } = require('sequelize');
    const whatsapp: any = await queryInterface.sequelize.query(query, { type: QueryTypes.SELECT });
    const whatsappId = whatsapp[0].id;
    await queryInterface.bulkUpdate("Schedules", { whatsappId }, { whatsappId: null })
  },

  down: (queryInterface: QueryInterface) => {
    return console.log("error 20231011182727-create-whatsappId-to-schedules.js");
  }
};

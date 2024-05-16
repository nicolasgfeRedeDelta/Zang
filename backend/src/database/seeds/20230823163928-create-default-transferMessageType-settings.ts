import { QueryInterface, Sequelize } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const query = 'SELECT "id" FROM "Companies"';
    const { QueryTypes } = require('sequelize');
    const companies: any= await queryInterface.sequelize.query(query, { type: QueryTypes.SELECT });
    const settingsData = companies.map((company) => ({
      companyId: company.id,
      key: "transferMessageQueue",
      value: "false",
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await queryInterface.bulkInsert("Settings", settingsData);

  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {});
  }
};

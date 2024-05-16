import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Users", "editQueue", {
        type: DataTypes.BOOLEAN,
      }),
      queryInterface.addColumn("Users", "viewChatbot", {
        type: DataTypes.BOOLEAN,
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "editQueue"),
      queryInterface.removeColumn("Users", "viewChatbot")
    ]);
  }
};

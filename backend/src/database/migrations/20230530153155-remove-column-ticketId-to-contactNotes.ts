
import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("ContactNotes", "ticketId");
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("ContactNotes", "ticketId", {
      type: DataTypes.INTEGER,
      references: { model: "Tickets", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },);
  }
};

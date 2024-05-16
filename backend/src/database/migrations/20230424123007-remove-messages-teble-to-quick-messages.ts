import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("QuickMessages", "message");
  },
  //ver como vai ser feito a questao das mensagens rapidas que ja tem no banco para migrar para outra tabela
  down: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("QuickMessages", "message", {
      type: DataTypes.STRING,
    });
  }
};

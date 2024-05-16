import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("QueueOptions", "message");
  },
  //ver como vai ser feito a questao das mensagens que ja tem no banco para migrar para outra tabela
  down: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("QueueOptions", "message", {
      type: DataTypes.STRING,
    });
  }
};
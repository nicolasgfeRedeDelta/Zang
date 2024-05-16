import { DataTypes, QueryInterface, Sequelize } from "sequelize";
const { QueryTypes } = require('sequelize');

const colors: any = [
  "#b80000",
  "#db3e00",
  "#fccb00",
  "#008b02",
  "#006b76",
  "#1273de",
  "#004dcf",
  "#5300eb",
  "#eb9694",
  "#fad0c3",
  "#fef3bd",
  "#c1e1c5",
  "#bedadc",
  "#c4def6",
  "#bed3f3",
  "#d4c4fb",
  "#4d4d4d",
  "#999999",
  "#f44e3b",
  "#fe9200",
  "#fcdc00",
  "#dbdf00",
  "#a4dd00",
  "#68ccca",
  "#73d8ff",
  "#aea1ff",
  "#fda1ff",
  "#333333",
  "#808080",
  "#cccccc",
  "#d33115",
  "#e27300",
  "#fcc400",
  "#b0bc00",
  "#68bc00",
  "#16a5a5",
  "#009ce0",
  "#7b64ff",
  "#fa28ff",
  "#666666",
  "#b3b3b3",
  "#9f0500",
  "#c45100",
  "#fb9e00",
  "#808900",
  "#194d33",
  "#0c797d",
  "#0062b1",
  "#653294",
  "#ab149e",
];

module.exports = {
  up: async (queryInterface) => {
    const whatsapps = await queryInterface.sequelize.query('SELECT "id", "companyId" FROM "Whatsapps"', { type: QueryTypes.SELECT });

    const uniqueColorMap = new Map();

    for (const whatsapp of whatsapps) {
      const companyId = whatsapp.companyId;
      const availableColors = colors.filter(color => {
        // Verificar se a cor não foi usada para o companyId
        return !uniqueColorMap.has(`${companyId}-${color}`);
      });

      if (availableColors.length === 0) {
        throw new Error(`Todas as cores já foram usadas para este companyId ${companyId}`);
      }

      const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      uniqueColorMap.set(`${companyId}-${selectedColor}`, true);

      await queryInterface.bulkUpdate("Whatsapps", { color: selectedColor }, { id: whatsapp.id });
    }

    await queryInterface.changeColumn('Whatsapps', 'color', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkUpdate("Whatsapps", { color: null }, {});
  }
};
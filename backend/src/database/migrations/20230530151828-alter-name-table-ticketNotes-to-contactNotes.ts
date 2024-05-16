'use strict';

import { QueryInterface } from "sequelize/types";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.renameTable("TicketNotes", "ContactNotes");
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.renameTable("ContactNotes", "TicketNotes");
  }
};

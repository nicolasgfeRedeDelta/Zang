'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeConstraint(
      "Whatsapps",
      "Whatsapps_name_key"
    );
  },

  down: (queryInterface) => {
    return queryInterface.addConstraint("Whatsapps", ["name"], {
      type: "unique",
      name: "Whatsapps_name_key"
    });
  }
};

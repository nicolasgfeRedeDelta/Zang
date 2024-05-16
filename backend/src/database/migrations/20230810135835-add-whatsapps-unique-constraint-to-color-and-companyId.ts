'use strict';

module.exports = {
  up: (queryInterface) => {
     queryInterface.removeConstraint(
      "Whatsapps",
      "Whatsapps_color_key"
    );
    return queryInterface.addConstraint("Whatsapps", ["color", "companyId"], {
      type: "unique",
      name: "Whatsapps_color_companyid_unique"
    });

  },

  down: (queryInterface) => {
    queryInterface.removeConstraint(
      "Whatsapps",
      "Whatsapps_color_companyid_unique"
    );
    return queryInterface.addConstraint("Whatsapps", ["color"], {
      type: "unique",
      name: "Whatsapps_color_key"
    });
  }
};

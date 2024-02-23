'use strict';

module.exports = {
  async up (query, Sequelize) {
    try{
      await query.addIndex('deviceHealth', ['deviceId']);
      await query.addIndex('deviceHealth', ['partId']);
      await query.addIndex('deviceHealth', ['partInstanceId']);
    }
    catch(err){
      console.log("Error in add Indexing in health",err)
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

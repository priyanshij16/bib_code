'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('statusType', {
          id: {
            type:Sequelize.INTEGER,
            primaryKey:true,
            autoIncrement:true
          },  
          type: {
            type: Sequelize.STRING,
            allowNull: false
          },
          priority: {
            type: Sequelize.INTEGER,
            allowNull: false
          }

      })

    }catch(error){

      console.log('error in creating statusType Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('statusType')

    }catch(error){

      console.log('error in deleting statusType table (Health) ::', error)

    }

  }

}

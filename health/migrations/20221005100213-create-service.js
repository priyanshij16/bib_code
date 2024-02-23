'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('service', {
        id: {
          type:Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        }
      
      })

    }catch(error){

      console.log('error in creating service Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('service')

    }catch(error){

      console.log('error in deleting service Table (Health) ::', error)

    }

  }

}

'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('healthStatus',{
        id: {
          type:Sequelize.INTEGER,
          allowNull: false,
          primaryKey:true,
          autoIncrement: true
        },
        type: {
          type: Sequelize.INTEGER,
          references:{
            model:'statusType',
            key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        description:{
          type:Sequelize.TEXT
        }
    
      })

    }catch(error){

      console.log('error in creating healthStatus table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('healthStatus')

    }catch(error){

      console.log('error in deleting healthStatus table (Health) ::', error)

    }

  }

}

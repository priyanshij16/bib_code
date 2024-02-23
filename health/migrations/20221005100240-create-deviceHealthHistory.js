'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('deviceHealthHistory',{ 
        id: {
          type:Sequelize.BIGINT,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true
        },
        deviceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references:{
            model:'device',
            key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        statusId:{
          type:Sequelize.INTEGER,
          references:{
            model:'healthStatus',
            key:'id'
          },  
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        partId:{
          type:Sequelize.INTEGER,
          references:{
            model:'part',
            key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        info:{
          type:Sequelize.JSONB,
          defaultValue:{}
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }

      })

    }catch(error){

      console.log('error in creating deviceHealthHistory Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('deviceHealthHistory')

    }catch(error){

      console.log('error in deleting deviceHealthHistory Table (Health) ::', error)

    }

  }

}

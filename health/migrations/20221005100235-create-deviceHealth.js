'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('deviceHealth',{
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
          onUpdate:'CASCADE',
          onDelete:'CASCADE'
        },
        organizationId: {
          type: Sequelize.UUID,
          allowNUll: true
        },
        statusId:{
          type:Sequelize.INTEGER,
          references:{
            model:'healthStatus',
            key:'id',
          },
         
          onDelete: 'CASCADE'
        },
        partId:{
          type:Sequelize.INTEGER,
          allowNUll:false,
          references:{
            model:'part',
            key:'id',
          },
          onDelete: 'CASCADE'
        },
        info:{
          type:Sequelize.JSONB,
          defaultValue:{}
        },
        partInstanceId:{
          type:Sequelize.INTEGER
        },
        eventId:{
          type:Sequelize.INTEGER,
          allowNull: true
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

      await queryInterface.addConstraint('deviceHealth', {
        fields: ['partId', 'deviceId', 'partInstanceId'],
        type: 'unique',
        name: 'deviceHealth_partId_deviceId_partInstanceId_key'
      })

    }catch(error){

      console.log('error in creating deviceHealth Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('deviceHealth')

    }catch(error){

      console.log('error in deleting deviceHealth Table (Health) ::', error)

    }

  }

}

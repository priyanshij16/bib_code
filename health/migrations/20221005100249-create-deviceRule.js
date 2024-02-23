'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('deviceRule', { 
        id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          primaryKey:true,
          autoIncrement: true
        },
        deviceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'device',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        statusId:{
          type: Sequelize.INTEGER,
          references:{
            model:'healthStatus',
            key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        partId:{
          type: Sequelize.INTEGER,
          references:{
            model:'part',
            key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        criticality:{
          type: Sequelize.ENUM('high','low'),
          defaultValue: 'high'
        },
        overRideStatus:{
          type: Sequelize.INTEGER,
          references:{
            model:'statusType',
            key:'id'
          }
        }

      })

    }catch(error){

      console.log('error in creating deviceRule Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('deviceRule')

    }catch(error){

      console.log('error in deleting deviceRule Table (Health) ::', error)

    }

  }

}

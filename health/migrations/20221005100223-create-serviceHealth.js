'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('serviceHealth',{
        id: {
          type:Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement:true
        },
        serviceId: {
          type: Sequelize.UUID,
          allowNull: false,
          references:{
          model:'service',
          key:'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        statusId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'healthStatus',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        info: {
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

      console.log('error in creating serviceHealth Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('serviceHealth')

    }catch(error){

      console.log('error in deleting serviceHealth Table (Health) ::', error)

    }

  }

}

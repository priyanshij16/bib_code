'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('organizationSeverity', {  
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        eventId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        severity: {
          type: Sequelize.STRING,
          allowNull: false
        },
        organizationId: {
            type: Sequelize.UUID,
            allowNull: false
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

      await queryInterface.addConstraint('organizationSeverity', {
        fields: ['eventId', 'severity', 'organizationId'],
        type: 'unique',
        name: 'organizationSeverity_eventId_severity_organizationId_key'
      })

    }catch(error){

      console.log('error in creating organizationSeverity Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      await queryInterface.dropTable('organizationSeverity')

    }catch(error){

      console.log('error in deleting organizationSeverity Table (Health) ::', error)

    }

  }

}

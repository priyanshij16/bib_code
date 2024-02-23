'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {
   
    try{

      await queryInterface.createTable('device', {  
        id: {
          type:Sequelize.UUID,
          primaryKey: true,
          allowNull: false
        },
        organisationId: {
          type: Sequelize.UUID,
          allowNull: false
        },
        hierarchyId: {
          type: Sequelize.UUID,
          allowNull: false
        }
      
      })

    }catch(error){

      console.log('error in creating device Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {
    
    try{

      await queryInterface.dropTable('device')

    }catch(error){
      console.log('error in deleting device Table (Health) ::', error)

    }
  }

}

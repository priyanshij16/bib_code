'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.createTable('part',{  
        id: {
          type:Sequelize.INTEGER,
          primaryKey:true
        },
        name: {
          type: Sequelize.STRING
        },
        manufacture: {
          type: Sequelize.STRING,
          allowNull: true
        },
        model: {
          type: Sequelize.STRING,
          allowNull: true
        },
        partParentId: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        notes: {
          type: Sequelize.STRING,
          allowNull: true
        }
  
      })

    }catch(error){

      console.log('error in creating part Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {
    
    try{

      await queryInterface.dropTable('part')

    }catch(error){

      console.log('error in deleting part Table (Health) ::', error)

    }

  }

}

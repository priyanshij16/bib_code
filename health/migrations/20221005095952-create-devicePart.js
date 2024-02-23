'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
   
    try{

      await queryInterface.createTable('deviceParts',{
        deviceId:{
          type:Sequelize.UUID,
          references:{
            model: 'device',
            key:'id'
          }
        },
        partId:{
          type:Sequelize.INTEGER,
          references:{
            model: 'part',
            key:'id'
          }
        },
        instanceId: {
          type: Sequelize.INTEGER,
          allowNull: true
        }

      })

    }catch(error){

      console.log('error in creating devicePart Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {
    
    try{

      await queryInterface.dropTable('deviceParts')

    }catch(error){

      console.log('error in deleting devicePart Table (Health) ::', error)

    }

  }

}

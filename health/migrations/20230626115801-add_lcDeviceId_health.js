'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    queryInterface.addColumn('device', 'lcDeviceId', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true
    }).catch((error)=>{
      console.log('error in adding lcDeviceId column in device Table ::', error)
    })

  },

  async down (queryInterface, Sequelize) {

    queryInterface.removeColumn('device', 'lcDeviceId').catch((error)=>{
      console.log('error in deleting lcDeviceId column in device Table ::', error)
    })
  }

}

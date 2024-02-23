'use strict'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      await queryInterface.bulkInsert('statusType', [
        {
          id: 0,
          type: 'uncertain',
          priority: 1
        },
        {
          id: 1,
          type: 'unmonitored',
          priority: 6

        },
        {
          id: 2,
          type: 'good',
          priority: 2
        },
        {
          id: 3,
          type: 'warning',
          priority: 4
        },
        {
          id: 4,
          type: 'error',
          priority: 5
        },
        {
          id: 5,
          type: 'info',
          priority: 3
        },
        {
          id:6,
          type:'info',
          priority: 3
        },
        {
          id: 7,
          type: 'maintainance',
          priority: 3
        }
      ],{})

      await queryInterface.sequelize.query('ALTER SEQUENCE "statusType_id_seq" RESTART WITH 9')

    }catch(error){

      console.log('error in seeding statusType in statusType Table (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {
  
    try{

      await queryInterface.bulkdelete('statusType', null, {} )

    }catch(error){

      console.log('error in deleting seeded statusType in statusType Table (Health) ::', error)

    }

  }

}

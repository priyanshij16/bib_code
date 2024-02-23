
module.exports = {

  up: async (queryInterface,sequelize) => {

    try{

      await queryInterface.bulkInsert('healthStatus', [
        {
          id: 0,
          description: 'Uncertain',
          type: 2
        },
        {
          id: 1,
          type: 0,
          description: 'unknown',
        },
        {
          id: 2,
          description: 'Good',
          type: 2
        },
        {
          id: 3,
          description: 'Unmonitored',
          type: 1
        },
        {
          id: 4,
          description: 'LMS connection lost',
          type: 4
        },
        {
          id: 5,
          description: 'Printer paper low',
          type: 3
        },
        {
          id: 6,
          description: 'Printer out of paper',
          type: 3
        },
        {
          id: 7,
          description: 'Printer offline',
          type: 4
        },
        {
          id: 8,
          description: 'Print has receipt left in dispenser',
          type: 3
        },
        {
          id: 9,
          description: 'Return Bin Full',
          type: 4
        },
        {
          id: 10,
          description: 'Moneybox Full',
          type: 4
        },
        {
          id: 11,
          description: 'Offline file waiting to upload',
          type:3
        },
        {
          id: 12,
          description: 'Possible fraud attempt',
          type: 3
        },
        {
          id: 13,
          description: 'Coin mech ongoing manual operation',
          type: 3
        },
        {
          id: 14,
          type: 4,
          description: 'Payment Device Jammed',
        },
        {
          id: 15, 
          description: 'Coin mech requires cleaning',
          type: 4
        },
        {
          id: 16,
          description: 'Part disconnected',
          type: 4
        },
        {
          id: 17 ,
          description: 'Coin mech requires service',
          type: 4
        },
        {
          id: 18,
          description: 'Out of Service',
          type: 4
        },
        {
          id: 19,
          description: 'Coin mech open longer than 60seconds',
          type:3
        },
        {
          id: 20,
          description: 'Off',
          type: 1
        },
        {
          id: 21,
          description: 'information',
          type: 2
        },
        {
          id: 22,
          description: 'Reader not ready',
          type: 4
        },
        {
          id: 23,
          description: 'Return not ready',
          type:3
        },
        {
          id: 24,
          description: 'Device Out Of Service',
          type: 4
        },
        {
          id: 25,
          description: 'Low Disk Space',
          type:3
        },
        {
          id:30, 
          description: 'Bin Not Available',
          type:4
        },
        {
          id: 31,
          type:3,
          description: 'Bin Missorted'
        },
        {
          id: 32,
          description: 'Bin Missorted/full',
          type: 4
        },
        {
          id: 33,
          description: 'BIn missorted/capacity',
          type:3
        },
        {
          id: 36,
          description: 'Feeder not ready',
          type: 4
        },
        {
          id: 37,
          description: 'AMH connection Lost',
          type:4
        },
        {
          id: 38,
          description: 'Bin Blocked',
          type: 4
        },
        {
          id: 39,
          description: 'Bin Capacity Threshold',
          type: 3
        },
        {
          id: 40,
          description: 'Bin Miscount',
          type:3
        },
        {
          id: 41,
          description: 'Queue problem',
          type:4
        },
        {
          id: 42,
          description: 'Dispense problem',
          type:4
        },
        {
          id: 49,
          description: 'Gate detection not checked',
          type:4
        },
        {
          id: 50,
          description: 'Gate detection',
          type:3
        },
        {
          id: 51,
          description: 'Payment device offline',
          type: 4
        },
        {
          id: 52 ,
          type: 3,
          description: 'Left Open',
        },
        {
          id: 53,
          description: 'Degraded Service',
          type: 3
        },
        {
          id: 54,
          description: 'Reconcile Inactive',
          type: 2
        },
        {
          id: 55,
          description: 'Reconcilation waiting',
          type: 3
        },
        {
          id: 56,
          description: 'Empty',
          type:4
        },
        {
          id: 57,
          description: 'Low change',
          type:3
        },
        {
          id: 60,
          description: 'Ready to open',
          type: 3
        },
        {
          id: 61,
          description: 'Opening',
          type:2
        },
        {
          id: 62,
          description: 'Open',
          type: 2
        },
        {
          id: 63,
          description: 'Closing',
          type:3
        },
        {
          id: 64,
          description: 'Closed',
          type:2
        },
        {
          id:65, 
          description:"Open+warning",
        type:3,
        
        },
        {
          id: 67,
          description:"Software Update available",
          type:5
        },
        {
          id: 68,
          type: 5,
          description: 'Installing Software Update'
        },
        {
          id: 69,
          description: 'Software Update Failed',
          type: 4
        },
        {
          id: 72,
          description: 'Return Door Error',
          type: 4,
        },
        {
          id: 200,
          description: 'Battery low detected',
          type: 4
        },
        {
          id: 201,
          description: 'Power Outage detected',
          type: 4
        }
      ],
      {}
      )

      await queryInterface.sequelize.query('ALTER SEQUENCE "healthStatus_id_seq" RESTART WITH 202')

    }catch(error){

      console.log('error in seeding health Status in healthStatus Table (Health) ::', error)

    }

  },

  down: async (queryInterface,sequelize) => {

    try{

      await queryInterface.bulkDelete('healthStatus', null, {})

    }catch(error){

      console.log('error in deleting seeded health Status in healthStatus Table (Health) ::', error)

    }

  }

}

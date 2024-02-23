'use strict'

import { StatusType } from '../models/statusType'

module.exports = {

  async up (queryInterface, Sequelize) {

    try{

      StatusType.update({
        type: 'off'
      },{
        where: {
          type: 'unmonitored'
        },
        logging: false
      })

    }catch(error){

      console.log('error in rename statusType (Health) ::', error)

    }

  },

  async down (queryInterface, Sequelize) {

    try{

      StatusType.update({
        type: 'monitored'
      },{
        where: {
          type: 'off'
        },
        logging: false
      })

    }catch(error){

      console.log('error in reverting renaming statusType ::', error)

    }

  }

}

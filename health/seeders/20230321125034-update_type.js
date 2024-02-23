'use strict';

import { StatusType } from '../models/statusType'

module.exports = {
  
  async up (queryInterface, Sequelize) {
    try {
      await StatusType.update({
        type : 'maintenance'
      },
      {
        where : {
        type : 'maintainance'
      },
    })
    } catch (error) {
      console.log("error in name statusType (Health) ::",error);
    }
  },

  async down (queryInterface, Sequelize) {
    try{
      await StatusType.update({
        type : 'maintainance'
      }, {
        where : {
          type : 'maintenance'
        },
      })
    }
    catch(error){
      console.log('error in reverting naming statusType ::',err)
    }
  }
};



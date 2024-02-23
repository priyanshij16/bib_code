const { check, query, param, oneOf, body } = require('express-validator')
import { Validator } from './Validator'

class DeviceHealthHistoryValidate extends Validator {
    constructor() {
        super({
            index: [
              
            
            ],

            store: [
                check('deviceId')
                    .trim()
                    .isUUID()
                    .withMessage(`deviceid should be UUID`)
                    .isEmpty()
                    .withMessage(`deviceId cannot be empty`),
                check('partId')
                    .trim()
                    .isInt()
                    .isEmpty()
                     .withMessage(`PartId should be a number`),
                check('statusId')
                  .trim()
                  .isInt()
                  .withMessage('statusId should be a a number')
                  .isEmpty(),
                check('info')
                    .trim()
                    
          

            ],

            update: [
                
            ],

        })
    }
}


export let deviceHealthHistoryValidate = new DeviceHealthHistoryValidate()
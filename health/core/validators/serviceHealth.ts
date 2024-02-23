const { check } = require('express-validator')
import { Validator } from './Validator'

class ServiceHealthValidate extends Validator {
    constructor() {
        super({
            index: [
                check('serviceId')
                    .trim()
                    .isUUID()
                    .withMessage(`serviceId should be UUID`)
                    .isEmpty()
                    .withMessage(`serviceId cannot be empty`),
                
                check('statusId')
                  .trim()
                  .isInt()
                  .withMessage('statusId should be a a number')
                  .isEmpty(),
               
            
            ],

            store: [
                check('serviceId')
                    .trim()
                    .isUUID()
                    .withMessage(`serviceId should be UUID`)
                    .isEmpty()
                    .withMessage(`serviceId cannot be empty`),
                
                check('statusId')
                  .trim()
                  .isInt()
                  .withMessage('statusId should be a a number')
                  .isEmpty(),
               
                
            ],

            update: [
                
            ],

        })
    }
}


export let serviceHealthValidate = new ServiceHealthValidate()
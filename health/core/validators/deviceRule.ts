const { check, query, param, oneOf, body } = require('express-validator')
import { Validator } from './Validator'

class DeviceRuleValidate extends Validator {
    constructor() {
        super({

            view: [

                param('id')
                .isInt()
                .withMessage('id should be an integer')
            ],

            index: [],
            
            store: [

                check('deviceId')
                    .notEmpty()
                    .withMessage(`deviceId  cannot be empty`)
                    .isUUID()
                    .withMessage(`deviceId should be UUID`) ,
                  
                    
                check('partId')
                    .notEmpty()
                    .withMessage(`partId cannot be empty`)
                    .isInt()
                    .withMessage(`partId should be a number`),
                  

                check('statusId')
                    .notEmpty()
                    .withMessage(`statusId cannot be empty`)
                    .isInt()
                    .withMessage('statusId should be a  number'),
                   
                check('criticality')
                    .trim()
                    .notEmpty()
                    .withMessage('criticality cannot be empty')
                    .toLowerCase()
                    .isIn(['high', 'low'])
                    .withMessage(
                        `sortOrder should only be one of ['high', 'low']`,
                    ),

                check('overRideStatus')
                    .notEmpty()
                    .withMessage(`cannot be empty`)
                    .isInt()
                    .withMessage('overRideStatus should be a number'),
                    
            ],

            update: [

                param('id')
                    .isInt()
                    .withMessage('Id should be an integer'),

                check('deviceId')
                    .optional()
                    .notEmpty()
                    .withMessage(`deviceId  cannot be empty`)
                    .isUUID()
                    .withMessage(`deviceId should be UUID`) ,
                  
                    
                check('partId')
                    .optional()
                    .notEmpty()
                    .withMessage(`partId cannot be empty`)
                    .isInt()
                    .withMessage(`partId should be a number`),
                  

                check('statusId')
                    .optional()
                    .notEmpty()
                    .withMessage(`statusId cannot be empty`)
                    .isInt()
                    .withMessage('statusId should be a  number'),

                check('criticality')
                    .optional()
                    .isString()
                    .trim()
                    .toLowerCase()
                    .isIn(['high', 'low'])
                    .withMessage(`criticality should only be one of ['high', 'low']`),

                check('overRideStatus')
                    .optional()
                    .isInt()
                    .withMessage('overRideStatus should be a number')

            ],

            delete: [
                param('id')
                .isInt()
                .withMessage('id should be an integer')
            ]

        })
    }
}


export let deviceRuleValidate = new DeviceRuleValidate()
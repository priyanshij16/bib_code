const { check } = require('express-validator')
import { Validator } from './Validator'

class StatusTypeValidate extends Validator {
    constructor() {
        super({
            view: [
             check('id')
             .isInt()
             .withMessage('id should be integer')
            
            ],
            
            index:[],

            store: [
                check('type')
                .notEmpty()
                .withMessage(`type cannot be empty`)
                .isString()
                .trim()
                .toLowerCase()
                .withMessage(`type should be STRING`),
            
                check('priority')
                .notEmpty()
                .withMessage('priority cannot be empty')
                .isInt()
                .withMessage('priority should be a number')
            ],

            update: [

                check('id')
                 .isInt()
                 .withMessage('id should be integer'),
        
                check('type')
                .optional()
                .notEmpty()
                .withMessage(`type cannot be empty`)
                .isString()
                .trim()
                .toLowerCase()
                .withMessage(`type should be STRING`),
            
                check('priority')
                .notEmpty()
                .withMessage(`priority cannot be empty`)
                .optional()
                .isInt()
                .withMessage('priority should be a number')
                
            ],

            delete: [
                
                check('id')
                .isInt()
                .withMessage('id should be integer')
            ]

        })
    }
}


export let statusTypeValidate = new StatusTypeValidate()
const { check, param} = require('express-validator')
import { StatusType } from '../../models/statusType'
import { Validator } from './Validator'

class HealthStatusValidate extends Validator {
    constructor() {
        super({
            view: [
                param('id')
                    .isInt()
                    .withMessage('id should be an integer')

            ],
            
            index:[],

            store: [
                check('type')
                .notEmpty()
                .withMessage(`type cannot be empty`)
                .isInt()
                .withMessage(`type should be Integer`),
            
            check('description')
              .notEmpty()
              .withMessage('description is required')
              .isString()
              .withMessage('description should be a STRING'),
                
            ],

            update: [

            param('id')
            .isInt()
            .withMessage('should be an integer'),

            check('type')
            .optional()
            .notEmpty()
            .withMessage('type cannot be empty')
            .isInt()
            .withMessage(`type should be number`),
           
            
            check('description')
              .optional()
              .isString()
              .withMessage(' description should be a string'),
                
            ],

            delete: [
                param('id')
                .isInt()
                .withMessage('id should be an integer')
            ],
            

            storeOrUpdate: [
                check('type')
                    .notEmpty()
                    .withMessage(`type cannot be empty`)
                    .isInt()
                    .withMessage(`type should be NUMBER`)
                    .custom(async (type: any) => {
                        if (!await StatusType.findOne({ where: { id: type } }))
                            throw new Error('type does not exist on statusType table')
                    }),

                check('description')
                    .notEmpty()
                    .trim()
                    .withMessage('description should be a STRING'),

            ],

        })
    }
}


export let healthStatusValidate = new HealthStatusValidate()
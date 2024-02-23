'use strict'
import {Request,Response,NextFunction} from 'express'
const { validationResult } = require('express-validator')
import { logger } from '../../utils/logger'

// interface rulesInterface{
//     [key:string]:any[]
// }

export class Validator {

    rules:any

    constructor(rules:any) {
        this.rules = rules
    }

    makeValidation(validatorKey:string):any{
        
        try {
            if (!validatorKey) {
                throw new Error(`Invalid validator key '${validatorKey}' supplied.`)
            }

            this.rules[validatorKey]

            return [
                ...this.rules[validatorKey],
                (req:Request, res:Response, next:NextFunction) => {
                    const errors = validationResult(req)
                    if (!errors.isEmpty()) {
                        return res.status(400).send({
                            errors: errors.array()
                        })
                    }
                    next()
                }
            ]
        } catch (err) {
            //resHndlr.sendError(res,err);
            logger.error(err)
        }
    }
}

//module.exports = Validator
'use strict'
const { check } = require('express-validator')
var Validator = require('../../../../config/packages/bib-validators/api-validators/Validator')

class Validate extends Validator {
    constructor() {
        super({
            index: [
                check('page')
                .trim()
                .isInt()
                .withMessage(`page should be an integer`),

                check('limit')
                .trim()
                .isInt()
                .withMessage(`limit should be an integer`),

                check('sortOrder')
                .trim()
                .toLowerCase()
                .isIn(['asc', 'desc'])
                .withMessage(`sortOrder should only be asc/desc`)
            ],
            store: [
                check('srcId')
                .trim()
                .not()
                .isEmpty()
                .withMessage(`srcId is required`),

               
                // check('isActive')
                // .custom(async(isActive) => {
                //     if (undefined !== isActive && "boolean" !== typeof isActive) {
                //         throw new Error('isActive should be boolean')
                //     }
                // }),

                // check('isArchived')
                // .custom(async(isActive) => {
                //     if (undefined !== isActive && "boolean" !== typeof isActive) {
                //         throw new Error('isActive should be boolean')
                //     }
                // }),

                async(req, res, next) => {

                    await check('rangeStart')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage(`rangeStart is required`)
                    .isNumeric()
                    .withMessage('rangeStart should be numeric')
                    .run(req)

                    await check('rangeEnd')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage(`rangeEnd is required`)
                    .isNumeric()
                    .withMessage('rangeEnd should be numeric')
                    .custom(async(rangeEnd,request) => {
                        let rangeStart =request.req.body.rangeStart;
                        if (parseInt(rangeEnd) < parseInt(rangeStart)) {
                            throw new Error('range start should be less than range end')
                        }
    
                    })
                    .run(req)
                
                    next()
                }
            ],
        })
    }
}

module.exports = new Validate()
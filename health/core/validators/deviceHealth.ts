const { check, query, param, oneOf, body } = require('express-validator')
import { Device } from '../../models/device'
import { HealthStatus } from '../../models/healthStatus'
import { Part } from '../../models/part'
import { Validator } from './Validator'

class DeviceHealthValidate extends Validator {
    constructor() {
        super({
            index: [

                check('deviceId')
                    .not()
                    .isEmpty()
                    .withMessage(`deviceId is required`)
                    .isArray()
                    .withMessage(`deviceid should be in Array`),

                check('deviceId.*')
                    .isUUID()
                    .withMessage(`deviceId should be UUID`),

            ],

            store: [
                check('eventSrc')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage(`eventSrc cannot be empty`)
                    .isUUID()
                    .withMessage(`eventSrc should be UUID`)
                    .custom(async (data: number) => {
                        if (!await Device.findByPk(data)) {
                            throw new Error('eventSrc not found')
                        }
                    }),

                check('data.eventData')
                    .isObject()
                    .withMessage('eventData should be an Object'),
                          
                check('data.eventData')                   
                    .not()
                    .isEmpty()
                    .withMessage(`eventData is required`),

                check('data.eventData.LocalTimestamp')
                    .optional()
                    .isISO8601()
                    .withMessage('Localtimestamp is invalid, use ISO 8601 date'),

                check('data.eventData.localTimestamp')
                    .optional()
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('localtimestamp cannot be blank')
                    .isISO8601()
                    .withMessage('localtimestamp is invalid, use ISO 8601 date'),

                check('data.eventData.Status')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('Status cannot be blank')
                    .isInt()
                    .withMessage('Status should be a number')
                    .custom(async (data: number) => {
                        if (!await HealthStatus.findByPk(data)) {
                            throw new Error('Status not found')
                        }
                    }),

                check('data.eventData.status')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('status cannot be blank')
                    .isInt()
                    .withMessage('status should be a number')
                    .custom(async (data: number) => {
                        if (!await HealthStatus.findByPk(data)) {
                            throw new Error('status not found')
                        }
                    }),

                check('data.eventData.PartInternalId')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('PartInternalId cannot be blank')
                    .isInt()
                    .withMessage('PartInternalId should be a number')
                    .custom(async (data: number) => {
                        if (!await Part.findByPk(data)) {
                            throw new Error('PartInternalId not found')
                        }
                    }),

                check('data.eventData.partInternalId')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('partInternalId cannot be blank')
                    .isInt()
                    .withMessage('partInternalId should be a number')
                    .custom(async (data: number) => {
                        if (!await Part.findByPk(data)) {
                            throw new Error('partInternalId not found')
                        }
                    }),

                check('data.eventData.PartInstanceId')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('PartInstanceId cannot be blank')
                    .isInt()
                    .withMessage('PartInstanceId should be a number'),

                check('data.eventData.partInstanceId')
                    .optional()
                    .not()
                    .isEmpty()
                    .withMessage('partInstanceId cannot be blank')
                    .isInt()
                    .withMessage('partInstanceId should be a number'),


            ],

            update: [

                check('deviceId')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage(`deviceId cannot be empty`)
                    .isUUID()
                    .withMessage(`deviceid should be UUID`),
            ],

        })
    }
}


export const deviceHealthValidate = new DeviceHealthValidate()
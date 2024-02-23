import { BaseController } from './BaseController'
import { Request, Response } from 'express'
import { Part, PartInterface } from '../models/part'
import { logger } from '../utils/logger'
import databaseInstance from '../config/db'
import { DevicePartInterface, DeviceParts } from '../models/devicePart'
var Constant = require('../core/constants/constant')

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import constant from '../../../config/packages/bib-response-handler/constants'
import { Publisher } from '../../../config/packages/bib-util/rabbit-mq/publisher'

let url: string = process.env.RABBITMQ_CACHING || ''
let exchange: string = process.env.EXCHANGE || 'notification_exchange'
const publisher = new Publisher(url, exchange)

export class PartController extends BaseController {
  constructor(public model: any) {
    super(model)
  }

  async readAll(req: Request, res: Response) {
    try {
      let { deviceId } = req.query
      logger.warn(deviceId, 'req device id')
      let include = [
        {
          model: DeviceParts,
          where: { deviceId },
          attributes: ['instanceId'],
        },
      ]

      let query: any = {}
      if (deviceId) query.include = include

      let partResult: any = await Part.findAndCountAll(query)
      partResult.deviceId = deviceId

      resHndlr.sendSuccessWithMsg(res, partResult)
    } catch (err) {
      logger.error(`Unable to fetch parts list`, err.message)
      resHndlr.sendError(res, err)
    }
  }

  async store(req: Request, res: Response) {
    let partInternalId = req.body.partId
    let partDeviceId = req.body.deviceId
    let partParentId = req.body.partParentId
    let partInstanceId = req.body.partInstanceId
    let devicePartName = req.body.devicePartName

    let partData: PartInterface = {
      id: partInternalId,
      name: req.body.partName,
      manufacture: req.body.partMaker,
      model: req.body.partModel,
      notes: req.body.notes,
      partParentId: partParentId,
    }

    let deviceParts: DevicePartInterface = {
      deviceId: partDeviceId,
      partId: partInternalId,
      instanceId: partInstanceId,
      devicePartName: devicePartName
    }

    const _transaction = await databaseInstance.transaction()

    try {
      let checkDevicePart = await DeviceParts.findAll({
        where: {
          deviceId: partDeviceId,
          partId: partInternalId,
          instanceId: partInstanceId,
        },
        transaction: _transaction,
      })

      if (checkDevicePart.length == 0) {
        let checkPart = await Part.findByPk(partInternalId, {
          transaction: _transaction,
        })

        if (checkPart == null) {
          await Part.create(partData, {
            transaction: _transaction,
          })

          await DeviceParts.create(deviceParts, {
            transaction: _transaction,
          })

          await _transaction.commit()

          //publish data to RabbitMQ
          try {
            publisher.publish(
              {
                action: 'POST',
                data: partData,
                service: 'device_management',
                table: 'part',
              },
              Constant.PART_KEY,
            )
          } catch (err) {
            logger.error('Message not sent to the RabbitMQ ' + err)
          }

          resHndlr.sendSuccessWithMsg(res, 'New part create successfully')
        } else {
          await DeviceParts.create(deviceParts, {
            transaction: _transaction,
          })

          await _transaction.commit()

          resHndlr.sendSuccessWithMsg(
            res,
            'New Device part create successfully',
          )
        }
      } else {
        await _transaction.commit()
        resHndlr.sendError(res, 'Device and Part is already exists')
      }
    } catch (err) {
      await _transaction.rollback()
      logger.error(`Something went wrong : `, err)
      resHndlr.sendError(res, err.message)
    }
  }

  async storeOrUpdate(req: Request, res: Response) {
    try {
      let partId = req.body.partId

      let partRequestBody: PartInterface = {
        id: partId,
        name: req.body.partName,
        manufacture: req.body.partMaker,
        model: req.body.partModel,
        partParentId: req.body.partParentId,
        notes: req.body.notes,
      }

      let checkPart = await Part.findByPk(partId)

      if (checkPart) {
        try {
          await Part.update(partRequestBody, {
            where: {
              id: partId,
            },
          })
        } catch (err) {
          resHndlr.sendError(res, 'Unable to update part Information')
        }
      } else {
        try {
          await Part.create(partRequestBody)
        } catch (err) {
          resHndlr.sendError(res, 'Unable to create a new part')
        }
      }
      resHndlr.sendSuccessWithMsg(
        res,
        'New part added successfully',
        constant.RESPONSE_STATUS.SUCCESS_CREATED,
      )
    } catch (err) {
      resHndlr.sendError(res, err.message)
    }
  }
}

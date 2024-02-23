import { BaseController } from './BaseController'
import { Request, Response } from 'express'
import { logger } from '../utils/logger'
import { DevicePartInterface, DeviceParts } from '../models/devicePart'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'

export class DevicePartController extends BaseController {

  constructor(public model: any) {
    super(model);
  }

  async readAll(req: Request, res: Response) {

    try {

      let devicePartResult = await DeviceParts.findAndCountAll()

      resHndlr.sendSuccessWithMsg(res, devicePartResult)

    } catch (err) {

      logger.error(`Unable to fetch parts list`, err.message)
      resHndlr.sendError(res, err);

    }

  }

  async store(partInfo: DevicePartInterface) {

    try {

      let checkDevicePart = await DeviceParts.findOne({
        where: {
          deviceId: partInfo.deviceId,
          partId: partInfo.partId,
          instanceId: partInfo.instanceId
        },
        raw: true
      })

      if (!checkDevicePart) {

        await DeviceParts.create(partInfo)

      } else {

        await DeviceParts.update(partInfo, {
          where: {
            deviceId: partInfo.deviceId,
            partId: partInfo.partId,
            instanceId: partInfo.instanceId
          }
        })

      }

    } catch (err) {
      logger.error(`Something went wrong in devicePart pooling`, err.message)
    }

  }

}



import { Op } from 'sequelize'
import { DevicePart, DevicePartInterface } from '../models/devicePart'
// import { HashMapInstance } from "../utils/HashMapUtility"
import { logger } from '../utils/logger'

export class devicePartController {
  private static devicePartInstance: devicePartController
  constructor() { }

  public async store(devicePart: DevicePartInterface) {
    try {
      let existing = await DevicePart.findAll({
        where: [{
          deviceId: devicePart.deviceId,
          partId: devicePart.partId
        }]
      })
      if (existing) {
        return await DevicePart.update(devicePart, {
          where: {
            [Op.and]: [
              { deviceId: devicePart.deviceId },
              { partId: devicePart.partId }
            ]
          }
        });
      }
      return await DevicePart.create(devicePart);
    } catch (err) {
      logger.debug("devicePartController error in storing device", err);
    }
  }

  async delete(devicePart: any) {
    try {
      return await DevicePart.destroy({
        where: {
          [Op.and]: [
            { deviceId: devicePart?.deviceId },
            { partId: devicePart?.partId }
          ]
        },
      });
    } catch (error) {
      logger.debug("err in deleting device and part", error.message)
    }
  }

  public static get Instance() {
    return this.devicePartInstance || (this.devicePartInstance = new this())
  }
}

export const devicePartControllerInstance = devicePartController.Instance

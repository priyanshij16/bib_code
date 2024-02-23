import { logger } from '../utils/logger'
import { Device } from '../models/device'

import { Publisher } from '../../../config/packages/bib-util/rabbit-mq/publisher'

export class DeviceController {
  publisher: any
  url: string = process.env.RABBITMQ_CACHING || ''
  exchange: string = process.env.EXCHANGE || 'notification_exchange'

  constructor() {
    this.publisher = new Publisher(this.url, this.exchange)
  }

  store = async (device: any) => {
    try {
      let existing = await Device.findByPk(device.id, {
        paranoid: false,
      })
      if (existing)
        return await Device.update(device, {
          where: { id: existing.id!! },
        })
      return await Device.create(device)
    } catch (err) {
      logger.debug('health DeviceController error in storing device', err)
    }
  }

  delete = async (ids: number[]) => {
    try {
      return await Device.destroy({
        where: {
          id: ids,
        },
      })
    } catch (error) {
      logger.debug("err in deleting device", error.message);
    }
  }
}
export const deviceControllerInstance = new DeviceController()

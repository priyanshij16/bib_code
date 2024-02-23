import { logger } from '../utils/logger'
import { KEY } from '../core/constants/constant'
import { Device } from '../models/device'
import Hierarchy,{ HierarchyInterface } from '../models/hierarchy'
import { Publisher } from '../../../config/packages/bib-util/rabbit-mq/publisher'

import { Op } from 'sequelize'
export class HierarchyController {
  publisher: any
  url: string = process.env.RABBITMQ_CACHING || ''
  exchange: string = process.env.EXCHANGE || 'notification_exchange'

  constructor() {
    this.publisher = new Publisher(this.url, this.exchange)
  }

  public async store(hierarchy: HierarchyInterface) {
    try {
      let existing = await Hierarchy.findByPk(hierarchy.id, {
        paranoid: false,
      })
      if (existing)
        return await Hierarchy.update(hierarchy, {
          where: { id: existing.id!! },
        })
      return await Hierarchy.create(hierarchy)
    } catch (err) {
      logger.error('error in storing hierarchy', err)
    }
  }

  async delete(data: any) {
    try {
      // first delete device for organisation or hierarchy then delete Hierarchy
      logger.debug('deleted Hierarchies ', data.id)
      let ids = data.id

      let replacementHierarchy = !data.replacementHierarchy
        ? null
        : data.replacementHierarchy
      let updatefields: any = {}

      if (replacementHierarchy) {
        updatefields = { hierarchyId: replacementHierarchy }
      } else {
        updatefields = {
          organisationId: null,
          hierarchyId: null,
          isActive: false,
        }
      }

      await Device.update(updatefields, {
        where: {
          hierarchyId: { [Op.in]: ids },
        },
      })

      await Hierarchy.destroy({ where: { id: { [Op.in]: ids } } })

      //publish data to RabbitMQ
      try {
        let updatedDevices = await Device.findAll({
          where: {
            id: {
              [Op.in]: ids,
            },
          },
        })

        for await (const device of updatedDevices) {
          logger.debug(device)

          this.publisher.publish(
            {
              action: 'PUT',
              data: device,
              service: 'device_management',
              table: 'device',
            },
            KEY,
          )
        }
      } catch (err) {
        logger.error('Message not sent to the RabbitMQ ' + err)
      }

      return await Hierarchy.destroy({
        where: {
          id: ids,
        },
      })
    } catch (error) {
      logger.error('err in deleting hierarchy', error)
    }
  }
}

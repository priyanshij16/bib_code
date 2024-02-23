import axios from 'axios'
import { SERVICE_TOKEN } from '../../core/constants/constant'
import { DeviceHealth } from '../../models/deviceHealth'
import { deviceHealthHashMapInstance } from '../../utils/devicehealthHashMap'
import { logger } from '../../utils/logger'
import { sendToAll } from '../../../webSocket/routes'
//not Used
export async function updateHealth(healthEvent: any){
    let isUnique = false
    let eventId = healthEvent.eventId
    let deviceId = healthEvent.deviceId
    let partId = healthEvent.partId
    let partInstanceId = healthEvent.partInstanceId
    let status = healthEvent.status
    let info = healthEvent.info
    let eventTimeStamp = healthEvent.eventTimeStamp
    let organizationId = healthEvent.organizationId
    logger.debug('update deviceHealth req body ::::', healthEvent)
    try {
      let key = `${deviceId}_${partId}_${partInstanceId}`

      
      let checkPartStatus = await DeviceHealth.findOne({
        where: {
          deviceId: deviceId,
          partId: partId,
          partInstanceId: partInstanceId,
        },
        attributes: ['updatedAt', 'statusId'],
        order: [['updatedAt', 'DESC']],
        raw: true,
      })

      if (!checkPartStatus) {
        isUnique = true
      } else {
        let minUpdateTime = new Date(checkPartStatus.updatedAt)
        let eventTime = new Date(eventTimeStamp)
        logger.debug(
          'minUpdateTime ::',
          minUpdateTime,
          'eventTime ::',
          eventTime,
          'difference ::',
          minUpdateTime.getTime() - eventTime.getTime(),
        )
        if (minUpdateTime.getTime() < eventTime.getTime()) {
          if (checkPartStatus.statusId == status) {

            await DeviceHealth.update(
              {
                eventId: eventId,
                statusId: status,
                info: info,
                updatedAt: eventTimeStamp,
                organizationId: organizationId,
              },
              {
                where: {
                  deviceId: deviceId,
                  partId: partId,
                  partInstanceId: partInstanceId,
                },
              },
            )
            let response = await sendToAll({ refresh: true })
            if (response == 'success') {
              logger.debug('Send data to websocket')
            } else {
              logger.error('Failed to send data to websocket')
            }
            isUnique = false
          } else {
            isUnique = true
          }
        } else {
          isUnique = false
          logger.debug(
            `partStatuses event timestamp is less than current time stamp`,
          )
        }
      }
      let apiResponse = {
        isUnique: isUnique,
        message: 'Device part status received',
      }
      return apiResponse
    //   resHndlr.sendSuccessWithMsg(res, apiResponse)
    } catch (error) {
      logger.error(`Something went wrong while fetching the deviceHealth`, error)
      throw error
    //   resHndlr.sendError(res, err.message)
    }
}

export async function notifyUsers(){
  try{
    let response = await sendToAll({ refresh: true })
    if (response == 'success') {
      logger.debug('Send data to websocket')
    } else {
      logger.error('Failed to send data to websocket')
    }
    let isUnique = true
    let apiResponse = {
      isUnique: isUnique,
      message: 'Device part status received',
    }
    return apiResponse
  }catch(error){
    logger.error(`Something went wrong while fetching the deviceHealth`, error)
    return error
  }
}
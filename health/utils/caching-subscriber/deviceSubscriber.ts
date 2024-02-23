import { Message } from '../../../../config/packages/bib-util/rabbit-mq'
import { Pooling } from '../../../../config/packages/bib-util/pooling/poolingService'

import { cachingConnection } from '../../../../app'
import { SERVICE_TOKEN } from '../../core/constants/constant'
import { logger } from '../logger'
import { DeviceController, deviceControllerInstance } from '../../controllers/DeviceController'

interface Notification {
  action: string
  data: any
  service: string
  table: string
}

enum NotificationAction {
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
}

let queueName: string = process.env.QUEUE || `health's_device_queue`
let pattern: string = process.env.PATTERN || 'device'

export async function deviceSubscriberInitForHealth() {
  let subscriber = cachingConnection.initQueue(queueName, pattern)
  schedular(26)
  let consumerTag = await subscriber?.activateConsumer(onMessage, {
    manualAck: true,
  })
  logger.info(
    'consumer activated for device caching in health:',
    consumerTag,
  )
}

function onMessage(message: Message) {
  try{
    logger.debug('Message consumed by device Health consumer')
    writeToDatabase(message.getContent())
    message.ack(true)
  }catch(err){
    logger.error("Error in device Subscriber",err)
  }
}

async function writeToDatabase(msg: Notification) {
  try{
    switch (msg.action) {
      case NotificationAction.POST:
        return await deviceControllerInstance.store(msg.data)
      case NotificationAction.PUT:
        return await deviceControllerInstance.store(msg.data)
      case NotificationAction.DELETE:
        return await deviceControllerInstance.delete(msg.data)
      default:
        return
    }
  }
  catch(err){
    return Promise.reject(err)
  }
}

async function schedular(interval: string | number) {
  let pooling = new Pooling(process.env.POOL_URL + '/v1/device', {
    headers: { 'service-token': SERVICE_TOKEN },
  })
  pooling.schedular((pool: any) => {

    logger.info(
      DeviceController.name,
      'updated at : ',
      pooling.date,
      new Date(Number(pooling.date)).toLocaleString(),
      ' number: ',
      pool.result.message.count,
    )
    for (let item of pool.result.message.rows as any[]) {
      if (item?.deletedAt && pooling.date != '0') {
        deviceControllerInstance.delete(item?.id)
      } else {
        deviceControllerInstance.store(item)
      }
    }
  }, interval)
}

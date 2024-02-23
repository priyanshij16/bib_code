import { Message } from '../../../../config/packages/bib-util/rabbit-mq/index'
import { Pooling } from '../../../../config/packages/bib-util/pooling/poolingService'

import { cachingConnection } from '../../../../app'
import { SERVICE_TOKEN } from '../../core/constants/constant'
import { logger } from '../logger'

import { partControllerInstance ,PartController} from '../../controllers/PartController'

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

let queueName: string = process.env.QUEUE || `health's_part_queue`
let pattern: string = process.env.PATTERN || 'part'

export async function partSubscriberInitForHealth() {
  let subscriber = cachingConnection.initQueue(queueName, pattern)
  schedular(23)
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
    logger.debug('Message consumed by device consumer')
    writeToDatabase(message.getContent())
    message.ack(true)
  }
  catch(err){
    logger.error("Error in part subscriber",err)
  }
}

async function writeToDatabase(msg: Notification) {
  try{
    switch (msg.action) {
      case NotificationAction.POST:
        return await partControllerInstance.store(msg.data)
      case NotificationAction.PUT:
        return await partControllerInstance.store(msg.data)
      case NotificationAction.DELETE:
        return await partControllerInstance.delete(msg.data)
      default:
        return
    }
  }
  catch(err){
    return Promise.reject(err)
  }
}

async function schedular(interval: string | number) {
  let pooling = new Pooling(process.env.POOL_URL + '/v1/part', {
    headers: { 'service-token': SERVICE_TOKEN },
  })
  pooling.schedular((pool: any) => {

    logger.info(
      PartController.name,
      'updated at : ',
      pooling.date,
      new Date(Number(pooling.date)).toLocaleString(),
      ' number: ',
      pool.result.message.count,
    )
    for (let item of pool.result.message.rows as any[]) {
      if (item?.deletedAt && pooling.date != '0') {
        partControllerInstance.delete(item?.id)
      } else {
        partControllerInstance.store(item)
      }
    }

  }, interval)
}

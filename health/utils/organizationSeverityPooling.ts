import { Message } from '../../../config/packages/bib-util/rabbit-mq/index'
import { Pooling } from '../../../config/packages/bib-util/pooling/poolingService'

import { cachingConnection, logger } from '../../../app'
import { OrganizationSeverityController } from '../controllers/OrganizationSeverityController'

interface Notification {
    action: string
    data: any
    service: string
    table: string
}

let queueName: string = `health's_org_severity_queue`
let pattern: string = 'organization_severity'
let organizationController = new OrganizationSeverityController()

export async function healthOrganizationSeveritySubscriberInit() {
    let subscriber = cachingConnection.initQueue(queueName, pattern)
    schedular(21)
    let consumerTag = await subscriber?.activateConsumer(onMessage, {
        manualAck: true,
    })
    logger.info('Consumer activated for health organisation severity caching :', consumerTag)
}

function onMessage(message: Message) {
    try{
        writeToDatabase(message.getContent())
        message.ack(true)
    }
    catch(err){
        logger.error("Error in organization severity pooling",err)
    }
}

async function writeToDatabase(msg: Notification) {
    try{
        organizationController.storeOrUpdate(msg.data)
    }
    catch(err){
        return Promise.reject(err)
    }

}

async function schedular(interval: string | number) {
    let pooling = new Pooling(process.env.POOL_URL + '/v1/organizationSeverity', {
        headers: { 'service-token': process.env.SERVICE_TOKEN },
    })
    pooling.schedular((pool: any) => {

        logger.info(
            'Health Organization Severity updated at : ',
            pooling.date,
            ' ',
            new Date(Number(pooling.date)).toLocaleString(),
            ' number: ',
            pool.result.message.count,
        )
        for (let item of pool.result.message.rows as any[]) {
            organizationController.storeOrUpdate(item)
        }

    }, interval)
}

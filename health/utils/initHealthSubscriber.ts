import axios from 'axios'
import { logger } from './logger'
import { SERVICE_TOKEN } from '../core/constants/constant'

export function initHealthSubcsriber() {

    axios
        .post(
            `${process.env.EVENT_SUBSCRIPTION_URL ||
            'http://localhost:4000/v1/subscription'
            }`,
            {
                subscriberName: 'healthSubscriber',
                callbackURL: process.env.DEVICE_HEALTH_END_POINT || 'http://localhost:4000/api/v1/deviceHealth',
            },
            { headers: { 'service-token': SERVICE_TOKEN } },
        )
        .then((res: any) => {
            logger.debug(res.data, 'healthService subscribed to events successfully')
        })
        .catch((err: any) => {
            if (err.response?.status == 409) logger.debug('request already completed')
            else logger.error(err.message, 'init request failed for subscription')
        })
}

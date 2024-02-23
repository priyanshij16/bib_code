import { loggerConfig } from '../../../config/packages/bib-logger/config'
import { ROOT_DIR, SERVICE_TOKEN } from '../core/constants/constant'

export const loggerConfig_ = loggerConfig({
  logRoot: ROOT_DIR + 'log',
  eventUrl: process.env.EVENT_URL || 'http://localhost:8629/v1/event',
  serviceName: `healthManagement_${process.pid}`,
  serviceCode: 11700,
  newStreams: [
    {
      path: ROOT_DIR + `log/access${process.pid}.log`,
      level: 'info',
      name: 'accessFileStream',
    },
  ],
  serviceToken: SERVICE_TOKEN,
})

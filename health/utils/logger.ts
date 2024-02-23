import { IEvent } from '../../../config/packages/bib-logger/helper'
import  BibLogger  from '../../../config/packages/bib-logger'

import { loggerConfig_ } from '../config/loggerConfig'
import { SERVICE_TOKEN } from '../core/constants/constant'
import { APP_NAME } from '../../../config/constant'

// initialising logger
export const logger = new BibLogger(
  loggerConfig_.config,
  loggerConfig_.eventUrl,
  loggerConfig_.serviceCode,
  SERVICE_TOKEN,
)

interface LoggerEvent extends IEvent {
  eventContext: {
    organizationId: number | null
  }
}

export const loggerEvent: LoggerEvent = {
  eventId: 0,
  severity: 'info',
  eventUser: 0,
  eventSrc: 0,
  eventSrcType: 'WebUI',
  eventSrcName: APP_NAME,
  clearingEvent: [],
  eventContext: {
    organizationId: null,
  },
  data: {
    metadata: {
      name: '',
      category: 'User Interaction',
      origin: '',
    },
    description: {
      content: '',
      detailedDiscription: '',
      params: JSON.parse('{}'),
    },

    traceLogs: [],
  },
  isAlert: false,
  isAudit: true,
  eventTimestamp: new Date().toISOString(),
}

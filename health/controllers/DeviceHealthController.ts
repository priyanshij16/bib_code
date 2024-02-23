import axios from 'axios'
import { Request, Response } from 'express'
import sequelize, { Op } from 'sequelize'
import healthDatabaseInstance from '../config/db'
import { SERVICE_TOKEN, couchHealthDBConstants } from '../core/constants/constant'
import { DeviceHealth } from '../models/deviceHealth'
import { DeviceRule } from '../models/deviceRule'
import { Part } from '../models/part'
import { StatusType } from '../models/statusType'
import { logger } from '../utils/logger'
import { BaseController } from './BaseController'
import deviceDB from '../../device/config/db'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import Exception from '../../../config/packages/bib-response-handler/Exception'
import constants from '../../../config/packages/bib-response-handler/constants'
import { deviceHealthHashMapInstance, healthModuleCache } from '../utils/devicehealthHashMap'
import { sendToAll } from '../../webSocket/routes'
import { legacyHashMapInstance } from '../../legacyService/utils/hashMap'
import moment from 'moment'
import { externalDeviceServices } from '../../device/utils/externalCom'
import { externalLegacyServices } from '../../legacyService/utils/externalCom'
import { externalAlertServices } from '../../alert/utils/externalCom'
import { getLCDevices } from '../../legacyService/utils/migrateLCData/LCDeviceSyncUp'
import Hierarchy from '../../device/models/hierarchy'
import SocketPublisher from '../../event/core/rabbit-mq/SocketPublisher'
import { SOCKET_ROUTING_KEY } from '../../event/config/constant'

const UNCERTAIN_PERIOD = '1 hour'
const UNCERTAIN_TYPE_ID = 0
const UNCERTAIN_PRIORITY = 1
const OFF_STATUS_ID = 20
const KIOSK_PART_ID = 0
const OFF_PRIORITY = 6
const OFF_TYPE_ID = 1
const GOOD_STATUS_ID = 2
const OOS_STATUS_ID = 18   // OOS stand out of Service
const OOS_TYPE_ID = 4
const DOOS_STATUS_ID = 24 // DOOS stand Device out of Service
interface RequestBody {
  deviceId: string
  partId: number
  instanceId?: number
  keyValue?: string
  deviceName?: any
  hierarchyId?:any
  orgId?: any
}

export class DeviceHealthController extends BaseController {
  publisher: any
  url: string = process.env.RABBITMQ_CACHING || ''
  exchange: string = process.env.EXCHANGE || 'notification_exchange'
  constructor(public model: any) {
    super(model)
  }

  read = async (req: Request, res: Response) => {
    let deviceId: any = req.query.deviceId || req.body.deviceId
    let apiResponse: Array<Object> = []
    let deviceRuleStatus: any

    try {
      for (let device of deviceId) {
        let deviceQuery = `SELECT 
        dh."partId", 
        dh."eventId", 
        hs.description as status, 
        dh."statusId", 
        dh."updatedAt" as timestamp,
        now() - dh."updatedAt" >= interval '${UNCERTAIN_PERIOD}' and dh."statusId" != ${OFF_STATUS_ID} is true as "isUncertain",   
        "partInstanceId", 
        dh.info,
        COALESCE(( select st3.id from "organizationSeverity" os3
        inner join "statusType" st3 on st3."type" = os3.severity
        where os3."eventId" = dh."eventId" and
        os3."organizationId" = dh."organizationId"
        limit 1), hs."type" ) as "typeId", 
        COALESCE((
            select 
              os.severity
            from 
              "organizationSeverity" os 
            where 
              os."eventId" = dh."eventId" 
              and os."organizationId" = dh."organizationId"
          ), 
          st."type"
        ) as "statusType",
        COALESCE(
          (
            select 
              st2.priority
            from 
              "statusType" st2 
            where
              (
            select 
              os2.severity
            from 
              "organizationSeverity" os2 
            where 
              os2."eventId" = dh."eventId" 
              and os2."organizationId" = dh."organizationId"
          )=st2."type" limit 1
          ), 
          st.priority
        ) as "priority"
        FROM 
          "deviceHealth" dh 
          inner join "healthStatus" hs on hs.id = dh."statusId"
          inner join "statusType" st on st.id = hs.type 
        WHERE 
          dh."deviceId" = :device 
        ORDER BY 
          timestamp desc`
              
        let deviceResponse:any = await healthDatabaseInstance.query(deviceQuery, {
          type: sequelize.QueryTypes.SELECT,
          replacements: {
            device: device
          },
          logging: false
        })

        if (deviceResponse.length != 0) {
          let deviceStatus = await DeviceRule.findAll({
            attributes: ['partId', 'overRideStatus'],
            where: {
              deviceId: device
            }
          })

          // initial assume true
          let isAllUncertain = true            // isAllUncertain indicate health status of all deviceComponent
          let isKiosk_Off: boolean = false
          let isKiosk_OOS: boolean = false
          let setKioskStatus: boolean = false
          let isKiosk_DOOS: boolean = false
          let excludedStatusIds: any
          if(process.env.useHashMaps){
            excludedStatusIds = deviceHealthHashMapInstance.healthStatusHashMap.get('excludedStatusIds')
          }
          else{
            let getStatus = await healthModuleCache.getDocument({
              selector: {
                _id: "excludedStatusIds",
                cacheName: couchHealthDBConstants.healthStatus
              }
            })
            if(getStatus){
              excludedStatusIds = getStatus[0]
            }
          }
          for (let component of deviceResponse) {
            let nowTime = new Date()
            let eventTime = new Date(component?.timestamp)
            let oneHourInMilliseconds = 60 * 60 * 1000

            if((nowTime?.getTime() - eventTime?.getTime() >= oneHourInMilliseconds) && (!component.isUncertain) && (component?.statusId == OFF_STATUS_ID) && (component?.partId != KIOSK_PART_ID))
              component.isUncertain = true

            if(!component.isUncertain)
              isAllUncertain = false

            if(component.partId == KIOSK_PART_ID && component.statusId == OFF_STATUS_ID){
              isKiosk_Off = true
              setKioskStatus = true
              break
            }

            if(component.partId == KIOSK_PART_ID && component.statusId == OOS_STATUS_ID){
              isKiosk_OOS = true
              setKioskStatus = true
              break
            }
            if(component.partId == KIOSK_PART_ID && component.statusId == DOOS_STATUS_ID){
              isKiosk_DOOS = true
              setKioskStatus = true
              break
            }

          }

          if(isKiosk_Off){
            for (let component of deviceResponse) {
              if (component.statusId == GOOD_STATUS_ID) {
                component.statusId = OFF_STATUS_ID
                component.status = 'off'
                component.priority = OFF_PRIORITY
                component.statusType = 'off'
                component.typeId = OFF_TYPE_ID
              }
            }
          }

          if(isKiosk_OOS){
            for (let component of deviceResponse) {
              if (component.statusId == GOOD_STATUS_ID) {
                component.statusId = OOS_STATUS_ID
                component.status = 'Out of Service'
                component.priority = 5
                component.statusType = 'error'
                component.typeId = OOS_TYPE_ID
              }
            }
          }

          if(isKiosk_DOOS){
            for(let component of deviceResponse) {
              if(component.statusId == GOOD_STATUS_ID){
                component.statusId = OOS_STATUS_ID
                component.status = 'Out of Service'
                component.priority = 5
                component.statusType = 'error'
                component.typeId = OOS_TYPE_ID
              }
            }
          }
          logger.debug('isAllUncertain Value ::', isAllUncertain)
          if(isAllUncertain){
            setKioskStatus = true
            for (let component of deviceResponse) {
              if (component.isUncertain && !excludedStatusIds?.statusList?.includes(component?.statusId)) {
                component.statusId = 0
                component.status = 'uncertain'
                component.priority = UNCERTAIN_PRIORITY
                component.statusType = 'uncertain'
                component.typeId = UNCERTAIN_TYPE_ID
              } else if(component.isUncertain && excludedStatusIds?.statusList?.includes(component?.statusId)){
                component.skipPart = true
              }
            }
          }

          switch (deviceStatus.length) {
            case 0:
              deviceRuleStatus = await this.undefinedDeviceRule(deviceResponse, deviceStatus,setKioskStatus)
              break

            default:
              deviceRuleStatus = await this.definedDeviceRule(deviceResponse, deviceStatus)
              break
          }

          apiResponse.push({
            deviceId: device,
            statusId: deviceRuleStatus[0].id,
            statusType: deviceRuleStatus[0].type,
            priority: deviceRuleStatus[0].priority,
            timestamp: deviceResponse[0]?.timestamp,
            components: deviceResponse
          })
        } else {
          let status = await StatusType.findOne({
            where: {
              type: 'off',
            },
          })

          apiResponse.push({
            deviceId: device,
            statusId: status?.id,
            statusType: status?.type,
            priority: status?.priority,
            components: [],
          })
        }
      }

      resHndlr.sendSuccess(res, apiResponse)
    } catch (err) {
      logger.error('Something went wrong while fetching deviceParts health information', err)
      resHndlr.sendError(res, err.message)
    }
  }

  store = async (req: any, res?: any) => {
    const socketPublisher: any = await SocketPublisher.getInstance()
    let healthdata = req.body ? req.body : req
    let isFunctionCall = healthdata?.isFunctionCall
    let checkCategory = healthdata.data?.metadata?.category || 'partStatuses'
    
    let eventId = healthdata?.eventId || null
    let deviceId = healthdata?.eventSrc
    let organizationId = healthdata.organizationId
    let partInternalId =
      healthdata.data?.eventData?.PartInternalId ??
      healthdata.data?.eventData?.partInternalId ?? healthdata?.partId
    let partInstanceId =
      healthdata.data?.eventData?.PartInstanceId ??
      healthdata.data?.eventData?.partInstanceId ?? healthdata?.partInstanceId
    let partStatus =
      healthdata.data?.eventData?.Status ?? healthdata.data?.eventData?.status ?? healthdata?.status
    let eventTimeStamp = healthdata.eventTimestamp ?? healthdata.eventTimeStamp
    let infoData = healthdata.info || healthdata.data?.eventData?.ExtendedProperties
    infoData = infoData ?? {}
    infoData.message =
      healthdata.data?.eventData?.Message ||
      healthdata.data?.eventData?.message ||
      ''
    if (checkCategory.toLowerCase() == 'partstatuses') {
      if (partInternalId !== null && partInternalId !== undefined) {
        if (partInstanceId !== null && partInstanceId !== undefined) {
          if (partStatus !== null && partStatus !== undefined) {
            if (eventTimeStamp) {
              try {
                let key = `${deviceId}_${partInternalId}_${partInstanceId}`
                let checkDeviceHealthPartStatus:any
                if(process.env.useHashMaps){
                  checkDeviceHealthPartStatus = deviceHealthHashMapInstance.deviceHealthHashMap.get(key)
                }
                else{
                  let getDeviceHealth = await healthModuleCache.getDocument({
                    selector: {
                      _id: key,
                      cacheName: couchHealthDBConstants.deviceHealth
                    }
                  })
                  if(getDeviceHealth){
                    checkDeviceHealthPartStatus = getDeviceHealth[0]
                  }
                }
                if(!checkDeviceHealthPartStatus){
                  checkDeviceHealthPartStatus = await DeviceHealth.findOne({
                    where: {
                      deviceId: deviceId,
                      partId: partInternalId,
                      partInstanceId: partInstanceId,
                    },
                  })
                }

                if (!checkDeviceHealthPartStatus) {
                  let createHealthRequestBody: any = {
                    eventId: eventId,
                    deviceId: deviceId,
                    partId: partInternalId,
                    statusId: partStatus,
                    partInstanceId: partInstanceId,
                    createdAt: eventTimeStamp,
                    updatedAt: eventTimeStamp,
                    info: infoData,
                    organizationId: organizationId,
                  }

                  let createNewDevicePart = await DeviceHealth.create(
                    createHealthRequestBody,
                  )
                  
                  if(process.env.useHashMaps)
                    deviceHealthHashMapInstance.deviceHealthHashMap.set(key,{
                      updatedAt: eventTimeStamp,
                      statusId: partStatus
                    })
                  else{
                    await healthModuleCache.insertDocument({
                      _id: key,
                      cacheName: couchHealthDBConstants.deviceHealth,
                      updatedAt: eventTimeStamp,
                      statusId: partStatus
                    })
                  }

                  //legacyHashMapInstance.partStatusEventMap.set(key,{
                  //  updatedAt: eventTimeStamp,
                  //  status: partStatus
                  //})
                  
                  if (createNewDevicePart) {
                    await this.createDevicePart(
                      deviceId,
                      partInternalId,
                      partInstanceId,
                    )

                    //publishing socket refresh in rmq
                    let rmqData = {refresh: true,organisationId: organizationId }
                    socketPublisher.publish({data: rmqData},SOCKET_ROUTING_KEY)

                    if(isFunctionCall){
                      return 'Device part status received'
                    }
                    else{
                      resHndlr.sendSuccessWithMsg(
                        res,
                        'Device part status received',
                        constants.RESPONSE_STATUS.SUCCESS_CREATED,
                      )
                    }
                  }
                } else {

                  try {
                    if (partInternalId == KIOSK_PART_ID) {
                      if (checkDeviceHealthPartStatus?.statusId == OFF_STATUS_ID && partStatus == GOOD_STATUS_ID) {
                        await this.removeDuplicateDeviceAndResetEvents(deviceId, partInternalId, healthdata)
                      } else {
                        let newEventTime = moment(eventTimeStamp)
                        let prevEventTime = moment(checkDeviceHealthPartStatus?.updatedAt)
                        let differenceInEvents = newEventTime.diff(prevEventTime, 'minutes')

                        if ((differenceInEvents >= 60) && partStatus == GOOD_STATUS_ID) {
                          await this.removeDuplicateDeviceAndResetEvents(deviceId, partInternalId, healthdata)
                        }
                      }
                    }
                  } catch(err) {
                    logger.error("Error in remove duplicate device and reset events for deviceId",deviceId)
                    throw err
                  }
                  await DeviceHealth.update(
                    {
                      eventId: eventId,
                      statusId: partStatus,
                      info: infoData,
                      updatedAt: eventTimeStamp,
                      organizationId: organizationId,
                    },
                    {
                      where: {
                        deviceId: deviceId,
                        partId: partInternalId,
                        partInstanceId: partInstanceId,
                      },
                    },
                  )

                  if(process.env.useHashMaps)
                    deviceHealthHashMapInstance.deviceHealthHashMap.set(key,{
                      updatedAt: eventTimeStamp,
                      statusId: partStatus
                    })
                  else{
                    await healthModuleCache.updateDocument({
                      _id: key,
                      cacheName: couchHealthDBConstants.deviceHealth,
                      updatedAt: eventTimeStamp,
                      statusId: partStatus
                    })
                  }

                  //legacyHashMapInstance.partStatusEventMap.set(key,{
                  //  updatedAt: eventTimeStamp,
                  //  status: partStatus
                  //})

                  //publishing socket refresh in rmq
                  let rmqData = {refresh: true, organisationId: organizationId}
                  socketPublisher.publish({data: rmqData},SOCKET_ROUTING_KEY)
                  
                  if(isFunctionCall){
                    return 'Device part status received'
                  }
                  else {
                      resHndlr.sendSuccessWithMsg(
                      res,
                      'Device part status received',
                      constants.RESPONSE_STATUS.SUCCESS,
                    )
                  }
                }
              } catch (err) {
                logger.error(`Something went wrong while updating healthStatus`,err)
                if(!isFunctionCall) resHndlr.sendError(res, err.message)
                else throw new Error(`Something went wrong while updating healthStatus`) 
              } 
            } else {
               if(!isFunctionCall) {
                 resHndlr.sendError(
                  res,
                  new Exception(
                    constants.ERROR_TYPE.NOT_FOUND,
                    'localTimestamp cannot be blank',
                  ),
              ) }else throw new Error(`localTimestamp cannot be blank`) 
            }
          } else {
            if(!isFunctionCall){
              resHndlr.sendError(
                res,
                new Exception(
                  constants.ERROR_TYPE.NOT_FOUND,
                  'status cannot be blank',
                ),
            ) }
            else{
              throw new Error('status cannot be blank')
            }
          }
        } else {
          if(!isFunctionCall){
            resHndlr.sendError(
              res,
              new Exception(
                constants.ERROR_TYPE.NOT_FOUND,
                'partInstanceId cannot be blank',
              ),
            )
          }
          else{
            throw new Error('partInstanceId cannot be blank')
          }
              
        }
      } else {
        if(!isFunctionCall){
          resHndlr.sendError(
            res,
            new Exception(
              constants.ERROR_TYPE.NOT_FOUND,
              'partInternalId cannot be blank',
            ),
          )
        }
        else{
          throw new Error('partInstanceId cannot be blank')
        }
      }
    } else {
      logger.debug(`Health service cannot processed non health events`)
      if(!isFunctionCall){
        resHndlr.sendSuccess(res, 'Required helth event to processed')
      }else{
        return true
      }
    }
  }

  update = async (req: Request, res: Response) => {
    let isUnique = false
    let eventId = req.body.eventId
    let deviceId = req.body.deviceId
    let partId = req.body.partId
    let partInstanceId = req.body.partInstanceId
    let status = req.body.status
    let info = req.body.info
    let eventTimeStamp = req.body.eventTimeStamp
    let organizationId = req.body.organizationId

    logger.debug('update deviceHealth req body ::::', req.body)

    try {
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

            let baseURL = process.env.WEBSOCKET_URL

            let response = await axios({
              url: `${baseURL}/notification`,
              method: 'POST',
              data: {
                refresh: true,
              },
              headers: {
                'Content-Type': 'application/json',
                'service-token': SERVICE_TOKEN,
              },
            })
            if (response) {
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

      resHndlr.sendSuccessWithMsg(res, apiResponse)
    } catch (err) {
      logger.error(`Something went wrong while fetching the deviceHealth`, err)
      resHndlr.sendError(res, err.message)
    }
  }

  async definedDeviceRule(partStatus: any, deviceRule: any) {
    let arrayOfOverRideStatuses: Array<Number> = []
    let arrayOfStatusId: Array<Number> = []

    for (let i = 0; i < partStatus.length; i++) {
      {
        for (let j = 0; j < deviceRule.length; j++) {
          if (partStatus[i].isUncertain) arrayOfStatusId.push(UNCERTAIN_TYPE_ID)
          else {
            if (partStatus[i].partId == deviceRule[j].partId) {
              arrayOfOverRideStatuses.push(deviceRule[j].overRideStatus)
              // break
            } else {
              arrayOfStatusId.push(partStatus[i].typeId)
            }
          }
        }
      }
      arrayOfStatusId = arrayOfStatusId.concat(arrayOfOverRideStatuses)
      const filteredArray = await this.filterStatusArray(arrayOfStatusId)
      return this.sortStatusesByPriority(filteredArray)
    }
  }

  async undefinedDeviceRule(partStatus: any, deviceRule: any,useKioskStatus: boolean) {
    let arrayOfStatusId: Array<Number> = []
    for (let i = 0; i < partStatus.length; i++) {
      if (partStatus[i].isUncertain && partStatus[i].typeId == UNCERTAIN_TYPE_ID)
        arrayOfStatusId.push(UNCERTAIN_TYPE_ID)
      else{

        // if(partStatus[i].partId != KIOSK_PART_ID && partStatus[i].typeId == OFF_TYPE_ID)
        //   continue

        // if(partStatus[i]?.skipPart)
        //   continue

        if(useKioskStatus){
          if(partStatus[i]?.partId == KIOSK_PART_ID){
            arrayOfStatusId.push(partStatus[i].typeId)
          }
        }
        else{
          if(partStatus[i].partId != KIOSK_PART_ID && partStatus[i].typeId == OFF_TYPE_ID) continue
          arrayOfStatusId.push(partStatus[i].typeId)
        }
      }
    }
    const filteredArray = await this.filterStatusArray(arrayOfStatusId)
    return this.sortStatusesByPriority(filteredArray)
  }

  async filterStatusArray(partStatus: any) {
    const finalArray: Array<Number> = []

    for (let i = 0; i < partStatus.length; i++) {
      if (!finalArray.includes(partStatus[i])) {
        finalArray.push(partStatus[i])
      }
    }
    return finalArray
  }

  async sortStatusesByPriority(partStatusFilterd: any) {
    return healthDatabaseInstance.query(`
      select "type", "id", priority 
      from "statusType" 
      where priority = (
        select max(priority) from "statusType" 
        where id in (${partStatusFilterd})
      )`,{
        type: sequelize.QueryTypes.SELECT ,
        logging: false
      },
    )
  }

  async createDevicePart(deviceId: string, partId: string, partInternalId: string) {
    try {
      let getPartInfo = await Part.findByPk(partInternalId, { raw: true })

      if (getPartInfo) {
        let newPartInfo = {
          deviceId: deviceId,
          partId: partId,
          partName: getPartInfo.name,
          partMaker: getPartInfo.manufacture,
          partModel: getPartInfo.model,
          partParentId: getPartInfo.partParentId,
          partInstanceId: partInternalId,
          notes: getPartInfo.notes,
        }


        await axios({
          method: 'POST',
          url:
            process.env.CREATE_NEW_PART_URL || 'http://localhost:4000/v1/part',
          data: newPartInfo,
          headers: {
            'Content-Type': 'application/json',
            'service-token': process.env.SERVICE_TOKEN,
          },
        }).catch((err) => {
          logger.error(
            `Something went wrong while sending AXIOS to devicePart:`, err.response?.data)
        })
      } else {
        logger.debug(`No part found in Health Management Service`)
      }
    } catch (err) {
      logger.error(`Something went wrong in AXIOS`, err)
    }
  }

  readAll = async (req: Request, res: Response) => {
    try {
      let devicePartsList = await healthDatabaseInstance.query(
        `SELECT "deviceId", "partId", "partInstanceId" as "instanceId", "createdAt", "updatedAt"  FROM public."deviceHealth"`,
        { type: sequelize.QueryTypes.SELECT, raw: true },
      )

      resHndlr.sendSuccess(res, devicePartsList)
    } catch (err) {
      resHndlr.sendError(res, err.message)
    }
  }

  async removeDuplicateDeviceAndResetEvents(deviceId: any, partInternalId: any, healthdata: any) {
    let deviceHierarchyId: any
    let deviceName: any
    let hierarchyId: any
    let lcDeviceInfo = await getLCDevices(deviceId);

    try {
      if(lcDeviceInfo) {
        deviceName = lcDeviceInfo?.Name
        let locationId = lcDeviceInfo?.LocationId?.toLowerCase()

        deviceHierarchyId = await Hierarchy.findOne({
          where: {lchierarchyId: locationId}
        })
        if(deviceHierarchyId){
          hierarchyId = deviceHierarchyId?.id
        }
        else{
          hierarchyId = healthdata?.hierarchyId
        }
      }
      else{
        deviceName = healthdata?.info?.name ?? healthdata?.eventSrcName
        hierarchyId = healthdata?.hierarchyId
        logger.error("Device id is not present in LCD")
      }
    }
    catch(err){
      logger.error("Error in getting the LCD device data", err)
    }

    let updateBody = {
      deviceId: deviceId,
      partId: partInternalId,
      deviceName: deviceName,
      hierarchyId: hierarchyId
    }

    // First Task - Update the device Name or device location 
    try {

      let checkDeviceDetails = await externalDeviceServices.getDeviceById({ deviceId })

      if (checkDeviceDetails) {

        if (checkDeviceDetails?.info?.name != updateBody.deviceName) {
          await externalDeviceServices.updateDeviceName(updateBody)
        }

        if (checkDeviceDetails?.hierarchyId != updateBody.hierarchyId) {
          await externalDeviceServices.updateLocationName(updateBody)
        }
      }
      else {
        logger.error("Device does not exist ")
        throw new Error()
      }
    }
    catch (err) {
      logger.error("Error in updating the devicename & locationName", err)
      throw err
    }

    //Second Task - Delete the devicePart & deviceHealth -----------------------
    try {

      let devicePartList: any = await externalDeviceServices.getDevicePartsList({deviceId, partInternalId})

      if (devicePartList.length != 0) {
        for (let device of devicePartList) {
          let keyValue = `${device?.deviceId}_${device?.partId}_${device?.instanceId}`

          let reqBody: RequestBody = {
            deviceId: device?.deviceId,
            partId: Number(device?.partId),
            instanceId: Number(device?.instanceId),
            keyValue: keyValue,
            orgId: healthdata?.organizationId ?? healthdata?.organisationId
          }

          await externalDeviceServices.deleteDevicePart(reqBody)

          try {
            await DeviceHealth.destroy({
              where: {
                [Op.and]: [
                  { deviceId: device.deviceId },
                  { partId: Number(device.partId) }
                ]
              },
            })

            logger.info("Successfully deleted the data from DeviceHealth Table")
          }
          catch (error) {
            logger.error("Error in deleting the data from DeviceHealth Table.", error)
            throw error
          }

          await externalLegacyServices.deletePartStatusEvent(reqBody)

          await externalAlertServices.deleteAlertFields(reqBody)
        }
      }
      return true
    }
    catch (err) {
      logger.error("Getting error while performing deletions", err)
      throw err;
    }
  }
}

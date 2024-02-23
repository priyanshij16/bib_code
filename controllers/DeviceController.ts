import { BaseController } from './BaseController'
import {  Request, Response } from 'express'
import { Op } from 'sequelize'
import axios from 'axios'
import sequelize from 'sequelize'
import { logger } from '../utils/logger'
import Hierarchy from '../models/hierarchy'
import { Device } from '../models/device'
import { CLOUDCHECK_MOBILE, CLOUDCHECK_MOBILE_LOC, SERVICE_TOKEN } from '../core/constants/constant'
import { Part } from '../models/part'
import { DeviceParts } from '../models/devicePart'
import { DeviceProfile } from '../models/deviceProfile'
import { DeviceType } from '../models/deviceType'
import { AuditEventName } from '../config/auditEventConfig'
import { fillEventDataFromToken,filterHierarchyForAudit } from '../utils/generateAuditLogs'
var Constant = require('../core/constants/constant')

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import Exception from '../../../config/packages/bib-response-handler/Exception'
import constant from '../../../config/packages/bib-response-handler/constants'
import message from '../../../config/packages/bib-response-handler/messages'
import { Publisher } from '../../../config/packages/bib-util/rabbit-mq/index'
import HierarchyService from '../../organisation/services/HierarchyService'
const { v4: uuidv4,validate } = require("uuid");


export class DeviceController extends BaseController {
  publisher: any
  url: string = process.env.RABBITMQ_CACHING || ''
  exchange: string = process.env.EXCHANGE || 'notification_exchange'

  constructor(public model: any) {
    super(model)
    this.publisher = new Publisher(this.url, this.exchange)
  }

  async readAll(req: Request, res: Response, query: any = {}) {

    try{
    let { sortBy, sortOrder, locations, name, searchParam }: any = req.query
    let page: number = Number(req.query.page)
    let limit: number = Number(req.query.limit)
    let orgId: any = req.query.organisationId
    let hierarchyId: any = req.query.hierarchyId
    let updatedAfter = req.query.updatedAfter
    let paranoid = req.query.paranoid ?? true
    if (undefined == page || 0 == page || isNaN(page)) {
      page = Constant.defaultPage
    }
    if (undefined == limit || 0 == limit || isNaN(limit)) {
      limit = Constant.defaultLimit
    }
    if (undefined == sortBy) {
      sortBy = 'id'
    }
    if (undefined == sortOrder) {
      sortOrder = 'ASC'
    }
 // 
    let parentId = req.query.locations as any[]
    if (res.locals.filters) {
      const { isBibliotheca, locations, organisationId } = res.locals.filters
      if (isBibliotheca && locations.length > 0) {
        if (organisationId === orgId) parentId = locations
      }
    }

    let offset = +Math.abs(page - 1) * limit

    let where = {} // empty object 

    if (hierarchyId) where = { ...where, hierarchyId: hierarchyId }
    if (orgId) where = { ...where, organisationId: orgId }

    let deviceName:any = ''
       
    // If 'name' is an object, assign its values to 'deviceName'
    if(name?.constructor?.name == 'Object') {
      deviceName = Object.values(name)
    } else {
      deviceName = name
    }
    // Use the 'Op.in' operator to filter by the values of 'deviceName'

    if(deviceName?.length) {
      where = {
        ...where,
        "info.name": {
          [Op.in]: deviceName
        }
      }
    }


    let deviceType = req.query.deviceTypes as any[]
     
    if(deviceType?.length){
      where={
        ...where,
        deviceTypeId:{
          [Op.in]:deviceType
        }
      }
    }
    
    if (updatedAfter) {
      let date = new Date(Number(updatedAfter))
      where = {
        ...where,
        [Op.or]: {
          updatedAt: {
            [Op.gte]: date,
          },
          deletedAt: {
            [Op.gte]: date,
          },
        },
      }
    }

    if (parentId && !Array.isArray(parentId)) parentId = [parentId]

    if (parentId?.length) {
      // it performs a Sequelize query to find records in 
      // Hierarchy model where the path attribute overlaps with the values in the parentId array
      let hierarchyList = await Hierarchy.findAll({
        where: {
          path: {  
            //path attribute overlaps with the values in the parentId array.
            [Op.overlap]: parentId,
          },
        },
        attributes: ['id'],
      })
         // 
      hierarchyList = hierarchyList.map((item: any) => item.dataValues.id)

      where = {  // where is an existing obj reprsent condn of seql
        ...where,  
        hierarchyId: { // hid should be present in list values of Hlist 
          [Op.in]: [...hierarchyList],
        },   // if Hlist= 1,2,3 >> Hid= 1,2,3 
      }
    }
 //  
    if(searchParam){ //
      if(validate(searchParam)){
        where = {  
          ...where,  // Query is constructed to filter result by id
          id: searchParam
        } // if validation fails then where obj constructed to perform multiple fieldss 
      }else{
        where = {
          ...where,
          [Op.or]: [
            { "info.name": {[Op.iLike]: `%${searchParam}%`}},
            { '$devicetype.deviceType$' : {[Op.iLike]: `%${searchParam}%`}},
            { '$hierarchy.name$' : {[Op.iLike]: `%${searchParam}%`}}
          ]
        }
      }
    }
// 
    query = {
      attributes:{
        include:[
          [sequelize.col('devicetype.deviceType'), 'deviceType'], 
          [sequelize.col('hierarchy.name'),'location'],
          [sequelize.col('deviceprofile.version'), 'version'], 
          [sequelize.col('deviceprofile.modelNo'), 'modelNo'], 
          [sequelize.col('deviceprofile.endOfSupport'), 'endOfSupport']
        ]
      },
      limit, // max no of record to return 
      offset, // no of records where to start 
      order: [[String(sortBy), String(sortOrder)]],
      where,
      include:[{
        model: Hierarchy,
        attributes: []
      },{
        model: DeviceType,
        attributes: []
      },{
        model: DeviceProfile,
        attributes: []
      }]
    }

    // for polling query
    if (updatedAfter) {
      query.paranoid = false
      delete query.limit
      delete query.offset
    }

    if(!paranoid)
      query.paranoid = false

    Device.findAndCountAll(query)
      .then((device: any) => {
        resHndlr.sendSuccessWithMsg(res, device)
      })
      .catch((err: any) => {
        logger.error('error in readAll devices ::::', err)
        resHndlr.sendError(res, err)
      })

    }catch(error){
      logger.error('error in read devices :::::', error)
      resHndlr.sendError(res, error)
    }
  }
 //seconf fn 
  async readAllFilter(req: Request, res: Response, query: any = {}) {

    try{
    let { sortBy, sortOrder, locations }: any = req.query
    if(locations){
    if(locations.length>0){
      if(locations[0].constructor.name == 'Object'){  
        locations = Object.values(locations[0]);
      }
    }
    
    if(locations.constructor.name == 'Object'){
      locations = Object.values(locations);
    }
    }
    let page: number = Number(req.query.page) // here Number >> convert string reprsentation to Number()
    let orgId: any = req.query.organisationId
    let hierarchyId: any = req.query.hierarchyId
    let updatedAfter = req.query.updatedAfter
    let paranoid = req.query.paranoid ?? true 
    if (undefined == page || 0 == page || isNaN(page)) {
      page = Constant.defaultPage
    }
    if (undefined == sortBy) {
      sortBy = 'id'
    }
    if (undefined == sortOrder) {
      sortOrder = 'ASC'
    }

    let parentId = locations as any[]
    if (res.locals.filters) { // locals are  similar like 
      const { isBibliotheca, locations, organisationId } = res.locals.filters
      if (isBibliotheca && locations.length > 0) {
        if (organisationId === orgId) parentId = locations
      }
    }
  // + shorthand way of converting a value to a no in js
    let offset = +Math.abs(page - 1)

    let where = {}
    // can't we define this gloabally then acces why to define again n again? 
    if (orgId) where = { ...where, organisationId: orgId }
    if (hierarchyId) where = { ...where, hierarchyId: hierarchyId }

    if (updatedAfter) {
      let date = new Date(Number(updatedAfter))
      where = {
        ...where,
        [Op.or]: {
          updatedAt: {
            [Op.gte]: date,
          },
          deletedAt: {
            [Op.gte]: date,
          },
        },
      }
    }

    if (parentId && !Array.isArray(parentId)) parentId = [parentId]

    if (parentId?.length) {
      let hierarchyList = await Hierarchy.findAll({
        where: {
          path: {
            [Op.overlap]: parentId,
          },
        },
        attributes: ['id'],
      })

      hierarchyList = hierarchyList.map((item: any) => item.dataValues.id)

      where = {
        ...where,
        hierarchyId: {
          [Op.in]: [...hierarchyList],
        },  
      }
    }

    query = {
      attributes:["deviceTypeId","id","organisationId","hierarchyId","info",  
      [sequelize.col('devicetype.deviceType'), 'deviceType'], [sequelize.col('hierarchy.name'),'location']],
      order: [[String(sortBy), String(sortOrder)]],
      where,
      include:[{
        model: Hierarchy,
        attributes: []
      },{
        model: DeviceType,
        attributes: []
      }]
    }

    // for polling query
    if (updatedAfter) {
      query.paranoid = false
      delete query.limit
      delete query.offset
    }

    if(!paranoid)
      query.paranoid = false

    Device.findAndCountAll(query)
      .then((device: any) => {
        resHndlr.sendSuccessWithMsg(res, device)
      })
      .catch((err: any) => {
        logger.error('error in readAllFilter devices ::::', err)
        resHndlr.sendError(res, err)
      })

    }catch(error){
      logger.error('error in readAllFilter devices :::::', error)
      resHndlr.sendError(res, error)
    }
  }


  read = async (req: Request, res: Response) => {
    let id = req.params.id

    this.baseModel
      .findByPk(id, {
        attributes:{
          include:[
            [sequelize.col('devicetype.deviceType'), 'deviceType'], [sequelize.col('hierarchy.name'),'location'],
            [sequelize.col('deviceprofile.version'), 'version'], [sequelize.col('deviceprofile.modelNo'), 'modelNo'],
             [sequelize.col('deviceprofile.endOfSupport'), 'endOfSupport'],
            [sequelize.col('deviceprofile.profile'), 'profile']
          ]
        },
        include: [
          {
            model: Part,
            through: { attributes: ['instanceId'] },
            attributes: ['id', 'name', 'manufacture', 'model'],
          },
          {
            model: Hierarchy,
            attributes: []
          },
          {
            model: DeviceType,
            attributes: []
          },
          {
            model: DeviceProfile,
            attributes: []
          }
        ]
      })
      .then((device: Device) => {
        if(!device){
          throw new Exception(
            constant.ERROR_TYPE.NOT_FOUND,
            `Device with id ${id} not found`,
          )
        } // 
        if (res.locals.filters) {
          // object destructing extract 3 property >> asign 3 property to same name 
          const {
            isBibliotheca,
            locations,
            organisationId,
          } = res.locals.filters
          if (!isBibliotheca) {
            if (organisationId !== device.organisationId) {
              throw new Exception(
                constant.ERROR_TYPE.FORBIDDEN,
                'You can only access devices in your organisation',
              )
            }
            if (locations && !locations.includes(device.hierarchyId)) {
              throw new Exception(
                constant.ERROR_TYPE.FORBIDDEN,
                'You can only access devices in your locations',
              )
            }
          }
        }
        resHndlr.sendSuccess(res, device)
      })
      .catch((err: any) => {
        resHndlr.sendError(res, err)
      })
  }

  create = async(req: Request, res: Response) => {
    try {
      if (res.locals.filters) {
        let { isBibliotheca, locations, organisationId } = res.locals.filters
        if (!isBibliotheca) {
          if (organisationId !== req.body.organisationId) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only create devices in your organisation',
            )
          }
          if (locations && !locations.includes(req.body.hierarchyId)) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only create devices in your locations',
            )
          }
        } 
      }
    } catch (err) {
      return resHndlr.sendError(res, err)
    }
  
    let deviceTypeName = await DeviceType.findByPk(req.body.deviceTypeId)
    if(deviceTypeName?.deviceType.toLowerCase() === CLOUDCHECK_MOBILE){ // EXPERIMENTAL DEVICE 
      let location = await HierarchyService.index(
        {},
        {
          where: {
            name: CLOUDCHECK_MOBILE_LOC,
            parentId: req.body.organisationId 
          }
        }
      )

      if(location.rows.length === 0) {
        try {
          let hierarchy = await HierarchyService.store(
            {
              headers: {},
              body: {
                id: uuidv4(),
                name: CLOUDCHECK_MOBILE_LOC,
                shortName: CLOUDCHECK_MOBILE_LOC,
                description: '',
                info: {},
                hierarchyTypeCode: 'LOC',
                parentId: req.body.organisationId,
                isActive: true,
                pa_line1: 'Add Address',
                pa_postcode: 'Add PostalCode',
                pa_county: 'Add County/Region',
                pa_country: '',
                pa_isActive: true,
                ba_sameAs_pa: true,
              },
            })
            logger.info("Hierarchy created successfully for cloudCheck mobile")
            req.body.hierarchyId = hierarchy.id
        }
        catch(err){
          logger.error("Error in creating the location of cloudCheck mobile deviceType")
        }
      }
      else {
        req.body.hierarchyId = location.rows[0].id
      }
    }
// ---------------------------------------------------------------------------------
    let healthStatus = Constant.DEFAULT_DEVICE_HEALTH_STATUS_OFF ||20;
    Part.findByPk(req.body.defaultPart ?? 0).then(async(part: any) => {
      let deviceType = req.body?.deviceTypeId 
      let deviceOrgId = req.body?.organisationId 
      let deviceTypeName = await DeviceType.findByPk(deviceType)
      
      if((deviceTypeName?.deviceType && (deviceTypeName?.deviceType?.toLowerCase()?.includes('cloudcheck mobile')) )){
        healthStatus = Constant.DEVICE_GOOD_HEALTH_STATUS ||2;
        let checkOrgExist = await Device.findOne({
          where:{
            organisationId : deviceOrgId,
            deviceTypeId : deviceType
          },
          attributes: ['organisationId','deviceTypeId'],
          raw: true
        });
        if(checkOrgExist){
          throw new Exception(constant.ERROR_TYPE.ALREADY_EXISTS,'device already exist for cloudCheck mobile')
        }
        else{
          logger.info(`No device exist for cloudCheck mobile`)
        }
      } 
      
      if(!part)
       throw new Exception(constant.ERROR_TYPE.NOT_FOUND, 'Device can not Created as default part does not exist')  
      try{

        if(!req.body.deviceProfileId && req.body.deviceProfile){
          let newDeviceProfile = await DeviceProfile.create({
            deviceTypeId: req.body.deviceProfile.deviceTypeId,
            version: req.body.deviceProfile.version,
            modelNo: req.body.deviceProfile.modelNo,
            profile: req.body.deviceProfile.profile,
            endOfSupport: req.body.deviceProfile.endOfSupport,
            createdBy: req.body.deviceProfile.createdBy,
            updatedBy: req.body.deviceProfile.createdBy
          })
          req.body.deviceProfileId = newDeviceProfile.id
        }

      }catch(error){
        logger.error('error in creating deviceProfile ::::', error)
        return resHndlr.sendError(res, 'Can not create device as device Profile is not created')

      }
      this.baseModel
      .create(req.body)
      .then(async (device: any) => {
        logger.debug('new Created device Information ::::',device.dataValues)
        await DeviceParts.create({
          deviceId: device.dataValues.id,
          partId: part.id,
          instanceId: 0,
          devicePartName: req.body.devicePartName
        })

        
        //publish data to RabbitMQ
        try {
          let deviceType = device?.deviceTypeId
          let deviceTypeName = await DeviceType.findByPk(deviceType)
          if(deviceTypeName){
            if(deviceTypeName?.deviceType && (!deviceTypeName?.deviceType?.toLowerCase()?.includes('cloudcheck'))){
              await HierarchyService.updateCloudCheckStatus(device?.organisationId)
            } else if(deviceTypeName?.deviceType && (deviceTypeName?.deviceType?.toLowerCase()?.includes('cloudcheck'))){
              let cloudData = { ApplicationAccountKey: device?.organisationId }
              await HierarchyService.updateCloudCheckEnabled(cloudData)
            }
          }
          this.publisher.publish(
            {
              action: 'POST',
              data: device,
              service: 'device_management',
              table: 'device',
            },
            Constant.KEY,
          )
        } catch (err) {
          logger.error('Message not sent to the RabbitMQ ' + err)
          throw err
        }
   
        setTimeout(async()=>{
          try{
            await this.createDefaultHealth(device.dataValues.id,
              device.dataValues.info.name,
              req.body.defaultPart ?? 0,healthStatus).catch((error)=>{
                logger.error('error in Creating device Health ::', error)
              })
          }catch(error){
            logger.error('error in creating defaulth Health For new Device ::::', error)
            throw error
          }
        }, 1000)
        
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

        resHndlr.sendSuccess(res,device,constant.RESPONSE_STATUS.SUCCESS_CREATED)

        //set Data For Audit Logs
        if (req.headers['id-token']) {
          let eventData = await fillEventDataFromToken(
            AuditEventName.DEVICE_CREATED,
            req.headers['id-token'].toString(),
            req.body.info?.name,
            req.body.organisationId,
            filterHierarchyForAudit(res)
          )
          logger.event(eventData)
        }

      })
      .catch(async(err: any)=> {
        logger.error('error in creation of new Devices ::::', err)
        //set Data for auditLogs
        if (req.headers['id-token']) {
          let eventData = await fillEventDataFromToken(
            AuditEventName.DEVICE_CREATION_FAILED,
            req.headers['id-token'].toString(),
            req.body.info?.name,
            req.body.organisationId,
            filterHierarchyForAudit(res)
          )
          logger.event(eventData)
          }
         
        resHndlr.sendError(res, err)
      })

    }).catch(async(error)=>{
      logger.error(' device can not created because part does not exist ', error)
      //set Data for auditLogs
      if (req.headers['id-token']) {
        let eventData = await fillEventDataFromToken(
          AuditEventName.DEVICE_CREATION_FAILED,
          req.headers['id-token'].toString(),
          req.body.info?.name,
          req.body.organisationId,
          filterHierarchyForAudit(res)
        )
        logger.event(eventData)      
        }
      resHndlr.sendError(res, error)
    })
  }

  update = async (req: Request, res: Response) => {
    let id = req.params.id
    let deviceInformation=await Device.findOne({
      where:{
        id:id
      },
      attributes:['organisationId','info']
    })
    let deviceOrganisationId=deviceInformation?.organisationId
    let deviceName=deviceInformation?.info.name
    try {
      if (res.locals.filter) {
        let { isBibliotheca, locations, organisationId } = res.locals.filters
        if (!isBibliotheca) {
          let device: Device = await this.baseModel.findByPk(id)
          if (organisationId !== device.organisationId) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only update devices in your organisation',
            )
          }
          if (locations && !locations.includes(device.hierarchyId)) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only update devices in your locations',
            )
          }
        }
      }
    } catch (err) {
      return resHndlr.sendError(res, err)
    }

    try{
      if(req.body.deviceProfileId){
        await DeviceProfile.update(req.body.deviceProfile,{
          where: {
            id: req.body.deviceProfileId,
          }
        })
      
      }else{
        if(req.body.deviceProfile){
          let newDeviceProfile = await DeviceProfile.create({
            deviceTypeId: req.body.deviceProfile.deviceTypeId,
            version: req.body.deviceProfile.version,
            modelNo: req.body.deviceProfile.modelNo,
            profile: req.body.deviceProfile.profile,
            endOfSupport: req.body.deviceProfile.endOfSupport,
            createdBy: req.body.deviceProfile.createdBy,
            updatedBy: req.body.deviceProfile.updatedBy,
            deletedBy: req.body.deviceProfile.deletedBy
          })
          req.body.deviceProfileId = newDeviceProfile.id
        }
      }

    }catch(error){
      logger.error('error in updating device Profile ::::', error)
      if (req.headers['id-token']) {
        let eventData = await fillEventDataFromToken(
          AuditEventName.DEVICE_UPDATION_FAILED,
          req.headers['id-token'].toString(),
          deviceName,
          deviceOrganisationId,
          filterHierarchyForAudit(res)
        )
        logger.event(eventData)
        }
      return resHndlr.sendError(res, error)
    }
    if(req.body.info){
      req.body.info={...deviceInformation?.info,...req.body.info}
    }
    this.baseModel
      .update(req.body, {
        fields: Object.keys(req.body),
        where: { id: req.params.id },
        logging: false,
        returning:true
      })
      .then(async (affectedRows:[number, any]) => {
        if (affectedRows[0]) {
          //publish data to RabbitMQ
          try {
            let publishData = await this.baseModel.findByPk(id)
            // logger.debug(publishData)

            this.publisher.publish(
              {
                action: 'PUT',
                data: publishData,
                service: 'device_management',
                table: 'device',
              },
              Constant.KEY,
            )
          } catch (err) {
            logger.error('Message not sent to the RabbitMQ ' + err)
          }
          if (req.headers['id-token']) {
            let eventData = await fillEventDataFromToken(
              AuditEventName.DEVICE_UPDATED,
              req.headers['id-token'].toString(),
              affectedRows[1][0].info.name,
              deviceOrganisationId,
              filterHierarchyForAudit(res)
            )
            logger.event(eventData)
            }
          resHndlr.sendSuccess(res, affectedRows)
        } else {
          throw new Error()
        }
      })
      .catch(async(err: any) => {
        err.errorType = constant.ERROR_TYPE.NOT_FOUND
        err.message = message.notFound
        if (req.headers['id-token']) {
          let eventData = await fillEventDataFromToken(
            AuditEventName.DEVICE_UPDATION_FAILED,
            req.headers['id-token'].toString(),
            deviceName,
            deviceOrganisationId,
            filterHierarchyForAudit(res)
          )
          logger.event(eventData)
          }
        
        resHndlr.sendError(res, err)
      })
  }

  delete = async (req: Request, res: Response) => {
    let id = req.params.id
    let deviceInformation=await Device.findOne({
      where:{
        id:id
      },
      attributes:['organisationId','info']
      
    })
    let deviceOrganisationId=deviceInformation?.organisationId
    let deviceName=deviceInformation?.info.name
    try {
      if(!deviceInformation){
        throw new Exception(
          constant.ERROR_TYPE.NOT_FOUND,
          `Device with id ${id} not found`,
        )
      }
      if (res.locals.filter) {
        let { isBibliotheca, locations, organisationId } = res.locals.filters
        if (!isBibliotheca) {
          let device: Device = await this.baseModel.findByPk(id)
          if (organisationId !== device.organisationId) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only delete devices in your organisation',
            )
          }
          if (locations && !locations.includes(device.hierarchyId)) {
            throw new Exception(
              constant.ERROR_TYPE.FORBIDDEN,
              'You can only delete devices in your locations',
            )
          }
        }
      }
    } catch (err) {
      return resHndlr.sendError(res, err)
    }

    this.baseModel
      .destroy({
        where: { id: req.params.id },
      })
      .then(async(removedRows: number) => {
      if (removedRows) {
          //publish data to RabbitMQ
          try {
            this.publisher.publish(
              {
                action: 'DELETE',
                data: { id: [id] },
                service: 'device_management',
                table: 'device',
              },
              Constant.KEY,
            )
          } catch (err) {
            logger.error('Message not sent to the RabbitMQ ' + err)
            throw err
          }
          if (req.headers['id-token']) {
            let eventData = await fillEventDataFromToken(
              AuditEventName.DEVICE_DELETED,
              req.headers['id-token'].toString(),
              deviceName,
              deviceOrganisationId,
              filterHierarchyForAudit(res)     
            )
            logger.event(eventData)
            }
          
          resHndlr.sendSuccess(res, removedRows)
        } else {
          throw new Error()
        }
      })
      .catch(async(err: any) => {
        if (req.headers['id-token']) {
          let eventData = await fillEventDataFromToken(
            AuditEventName.DEVICE_DELETION_FAILED,
            req.headers['id-token'].toString(),
            deviceName,
            deviceOrganisationId,
            filterHierarchyForAudit(res)
          )
          logger.event(eventData)
          }

        
        
        resHndlr.sendError(res, {
          errorType: constant.ERROR_TYPE.NOT_FOUND,
          message: 'Device not found',
        })
      })
  }

  updateHierarchy = (req: Request, res: Response) => {
    let replacementHierarchy = !req.body.replacementHierarchy
      ? null
      : req.body.replacementHierarchy
    let deletedHierarchies = req.body.deletedHierarchyList
    let updatefields = {}

    if (replacementHierarchy) {
      updatefields = { hierarchyId: replacementHierarchy }
    } else {
      updatefields = {
        organisationId: null,
        hierarchyId: null,
        isActive: false,
      }
    }

    this.baseModel
      .update(updatefields, {
        where: {
          hierarchyId: { [Op.in]: deletedHierarchies },
        },
      })
      .then((result: any) => {
        return resHndlr.sendSuccess(res, result)
      })
      .catch((err: any) => {
        logger.error(err)
        return resHndlr.sendError(res, err)
      })
  }

  createDefaultHealth = async(deviceId: string, deviceName: string, part: number, status:any) => {

    try{

      logger.debug('creating default Health for new Created Device ::', deviceId, deviceName, part)

      let deviceHealthReqBody = {
          "eventId": "36020",
          "severity": "off",
          "eventUser": null,
          "eventSrc": deviceId,
          "eventSrcType": "device",
          "eventSrcName": deviceName,
          "clearingEvent": [],
          "data": {
            "metadata": {
              "name": "Good",
              "category": "partStatuses",
              "origin": ""
            },
            "description": {
              "content": "Unknown",
              "detailedDescription": "",
              "params": {}
            },
            "traceLogs": [],
            "eventData": {
              "LocalTimestamp": new Date(),
              "Message": "[{\\\"Warning\\\":false,\\\"Drive\\\":\\\"C:\\\\\\\\\\\",\\\"TotalSize\\\":106540560384,\\\"TotalFreespace\\\":62902984704,\\\"AvailableFreespace\\\":62902984704}]",
              "Status": status||20,
              "PartInternalId": String(part),
              "PartInstanceId": "0"
            }
          },
          "isAlert": true,
          "isAudit": false,
          "eventTimestamp": new Date()
      }

      logger.debug('deviceHealth req body :::::', deviceHealthReqBody)

      let deviceHealth = await axios({
        method: 'POST',
        url: process.env.DEVICE_HEALTH_END_POINT ?? 'http://localhost:4000/api/v1/deviceHealth',
        data: deviceHealthReqBody,
        headers: {
          'Content-Type': 'application/json',
          'service-token': SERVICE_TOKEN,
        },
      })

      logger.debug('default deviceHealth created :::::', deviceHealth)
      // return deviceHealth

    }catch(error){
      logger.error(`error in creating of default health status for deviceId ${deviceId} and deviceName ${deviceName}`, error.response?.data)
      throw error
    }
  }
  async deviceFilter(req: Request, res: Response) {

    try {
      let { locations, organisationId, } = req.query
      let where = {}
      if (locations?.length)
      where = {
        ...where,
        hierarchyId: {
          [Op.in]: locations
        }
      }
      if (organisationId) where = { ...where, organisationId: organisationId }
      const nameLiteral:any  = sequelize.literal(`info->>'name' as "Name"`);
      let deviceData = await Device.findAll({
        raw: true,
        where: { ...where },
        attributes: ['id', 'serialNo', nameLiteral, 'devicetype.deviceType'],
        include: [
          {
            model: DeviceType,
            attributes: [],
          },
        ],
      })
      resHndlr.sendSuccessWithMsg(res, deviceData)

    } catch (err) {

      logger.error(`Unable to fetch deviceFilteredData`, err.message)
      resHndlr.sendError(res, err);

    }

  }
  // for get all components(device parts) by organisationId
  async getDeviceParts(req:any,res:any){
    let organisationId = req.query.organisationId
    try{
      let deviceParts = await Device.findAll({
        where:{ organisationId: organisationId},
        include:[{
          model: Part,
          attributes: ['name']
        }],
        raw: true
      })

      let parts = deviceParts.reduce((acc:any,obj:any)=>{
        if ((!acc.includes(obj['parts.name'])) && (obj['parts.name']!=null)) {
          acc.push(obj['parts.name']);
        }
        return acc;
      },[])

      parts.sort()
      logger.debug(`Successfully fetched the device parts for organisationId:${organisationId}`)
      resHndlr.sendSuccess(res,parts)

    }catch(error){
      logger.error(`Error in fetching the device parts for orgnaisationId:${organisationId}`)
      resHndlr.sendError(error)
    }
  }
}

import { Request, Response } from 'express'
import { Op } from 'sequelize'
import { BaseController } from '../../health/controllers/BaseController'
import { Device } from '../models/device'
import { HealthStatus } from '../models/healthStatus'
import { Part } from '../models/part'
import { StatusType } from '../models/statusType'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import Exception from '../../../config/packages/bib-response-handler/Exception'
import constant from '../../../config/packages/bib-response-handler/constants'
import { logger } from '../utils/logger'

export class DeviceRuleController extends BaseController {
    public baseModel: any

    constructor(public models: any) {
        super(models)
    }

    create = async(req:Request,res:Response)=>{
        
        try{

            const { statusId, deviceId, partId,overRideStatus } = req.body

            if(!await HealthStatus.findByPk(statusId)) 
              throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'statusId does not exist ')

            else if(!await Device.findByPk(deviceId)) 
              throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'deviceId does not exist ')
              
            else if(!await Part.findByPk(partId))
              throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'partId does not exist ')

            if(!await StatusType.findByPk(overRideStatus))
             throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'status Type id does not exist on statusType Table ')
    
            const isRuleExist= await this.baseModel.findOne({
            where: {
                [Op.and]: [
                    { deviceId: deviceId},
                    { partId: partId},
                    {statusId: statusId}
                ]
            }
            })

            if(isRuleExist)
              throw new Exception(constant.ERROR_TYPE.ALREADY_EXISTS,'Rule already exist')
           
            await this.baseModel.create(req.body)

            resHndlr.sendSuccess(res, 'Rule Created Successfully')
        

        }catch(err){
            logger.error('err in create device Rule', err)
            resHndlr.sendError(res, err)
        }


    }

    update = async(req:Request,res:Response)=>{
        try{

        const { deviceId,partId,statusId,overRideStatus, criticality } = req.body
            
        const isRuleExist= await this.baseModel.findByPk(req.params.id)

        if(!isRuleExist)
            throw new Exception(constant.ERROR_TYPE.NOT_FOUND,`Rule does not exist for id = ${req.params.id}`)
          
        if(statusId && !await HealthStatus.findByPk(statusId)) 
            throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'statusId does not exist ')
              
               
        if(deviceId && !await Device.findByPk(deviceId)) 
            throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'deviceId does not exist ')
           
        if(partId && !await Part.findByPk(partId))
            throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'partId does not exist ')
            
           
        if(overRideStatus && !await StatusType.findByPk(overRideStatus))
           throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'status Type id does not exist  ')
            
        await this.baseModel.update(req.body,{
            fields: Object.keys(req.body),
            where: { id: req.params.id }, paranoid: true
        })

        resHndlr.sendSuccess(res, `Rule updated Successfully for id = ${req.params.id}`)
        
        }catch(err){
            logger.error('err in Updating device Rule', err)
            resHndlr.sendError(res, err)
        }
    }
}
import { BaseController } from './BaseController'
import { StatusType } from '../models/statusType'
import { Request, Response } from 'express'
import { HealthStatus, HealthStatusInterface } from '../models/healthStatus'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import Exception from '../../../config/packages/bib-response-handler/Exception'
import constant from '../../../config/packages/bib-response-handler/constants'
import { logger } from '../utils/logger'

export class HealthStatusController extends BaseController {

   constructor(public model: any) { super(model) }

   async storeOrUpdate(req: Request, res: Response) {

      try {

         let partId = req.body.id

         let partRequestBody: HealthStatusInterface = {
            id: partId,
            type: req.body.type,
            description: req.body.description,
         }

         let checkPart = await HealthStatus.findByPk(partId)

         if (checkPart) {

            try {
               await HealthStatus.update(partRequestBody, {
                  where: {
                     id: partId
                  }
               })
            } catch (err) {
               resHndlr.sendError(res, 'Unable to update status Information')
            }

         } else {

            try {
               await HealthStatus.create(partRequestBody)
            } catch (err) {
               resHndlr.sendError(res, 'Unable to create a new status')
            }

         }
         resHndlr.sendSuccessWithMsg(res, 'New status added successfully', constant.RESPONSE_STATUS.SUCCESS_CREATED)
      } catch (err) {
         resHndlr.sendError(res, err.message)
      }
   }

   store = async(req: Request, res: Response ) => {

     try{

      let type = req.body.type

      if(!await StatusType.findOne({where:{id:type}}))
         throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'status Type id does not exist ')

     
      await this.baseModel.create(req.body)

      resHndlr.sendSuccess(res, 'Type Created Successfully')

      }catch(err){

         logger.error('err in creating type', err)
         resHndlr.sendError(res, err)
         
      }
   }

   update=async(req:Request,res:Response)=>{
      let type=req.body.type
      let id=req.params.id
      try{

         if(!await this.baseModel.findByPk(id))
          throw new Exception(constant.ERROR_TYPE.NOT_FOUND, 'Id not found')

         if(type && !await StatusType.findOne({where:{id:type}}))
            throw new Exception(constant.ERROR_TYPE.BAD_REQUEST,'status Type Id does not exist')
         
         this.baseModel.update(req.body, {
            fields: Object.keys(req.body),
            where: { id: req.params.id }, paranoid: true
         })

         resHndlr.sendSuccess(res, 'Health Status Updated Successfully')

      }
      catch(err){
         logger.error('err in updating type', err)
         resHndlr.sendError(res, err)
      }
   }

}

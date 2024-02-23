import { StatusType } from '../models/statusType'
import { BaseController } from './BaseController'
import { Request, Response } from 'express'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import Exception from '../../../config/packages/bib-response-handler/Exception'
import constant from '../../../config/packages/bib-response-handler/constants'
import { logger } from '../utils/logger'

export class StatusTypeController extends BaseController{

   constructor(public model: any) { super(model) }

   store = async(req:Request,res:Response) => {

      try{

      const { type }=req.body

      if( await StatusType.findOne({ where: { type: type } }) )
         throw new Exception(constant.ERROR_TYPE.ALREADY_EXISTS, 'Type already exist')
      
      await this.baseModel.create(req.body)

      return resHndlr.sendSuccess(res, 'Status Type Created Successfully')
      
      }catch(err){
         logger.error('err in Creating Status Type ', err)
         resHndlr.sendError(res, err)
      }

         
   }

   update = async(req:Request,res:Response) => {

      try{

         if(!await this.baseModel.findByPk(req.params.id))
            throw new Exception(constant.ERROR_TYPE.NOT_FOUND, 'Status Type id does not Exist')

         if(req.body.type && await this.baseModel.findOne({ where: { type: req.body.type } }))
            throw new Exception(constant.ERROR_TYPE.ALREADY_EXISTS, 'Status Type is already Exist')

         await this.baseModel.update( req.body, {
            fields: Object.keys(req.body),
            where: { id: req.params.id }, paranoid: true
         })

        return resHndlr.sendSuccess(res, 'Status Type Updated Successfully')
     
      }catch(err){
         logger.error('err in Updating Status Type ', err)
         resHndlr.sendError(res, err)
      }

         
   }

}
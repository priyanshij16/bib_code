import { BaseController } from './BaseController'
import { DeviceProfile } from '../models/deviceProfile'
import { Request, Response } from 'express'
import { Device } from '../models/device'
var Constant = require('../core/constants/constant')

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import constant from '../../../config/packages/bib-response-handler/constants'
import message from '../../../config/packages/bib-response-handler/messages'
import { logger } from '../utils/logger'

export class DeviceProfileController extends BaseController {
  constructor(public model: any) {
    super(model)
  }

  async readAll(req: Request, res: Response){

    let { sortBy, sortOrder, search } = req.query
    let page: number = Number(req.query.page)
    let limit: number = Number(req.query.limit)
    if (undefined == page || 0 == page || isNaN(page)) { page = Constant.defaultPage}
    if (undefined == limit || 0 == limit || isNaN(limit)) { limit =Constant.defaultLimit}
    if (undefined == sortBy) { sortBy = 'id' }
    if (undefined == sortOrder) { sortOrder = 'ASC' }

    let offset = +Math.abs(page - 1) * limit


    let query = { limit, offset, order: [String(sortBy), String(sortOrder)]}

    DeviceProfile.findAndCountAll(query)
            .then((eventRange: any) => {
                resHndlr.sendSuccessWithMsg(res, eventRange);
            })
            .catch((err: any) => {
                resHndlr.sendError(res, err);
            });

  }
  read = (req: Request, res: Response) => {
    this.baseModel.findOne({
      where: {
        id: req.params.id
      },
      include: Device
    })
      .then((eventRange: any) => {

        if (eventRange) {
          resHndlr.sendSuccessWithMsg(res, eventRange);
        } else {
          throw new Error();
        }
      })
      .catch((err: any) => {
        logger.error(err);
        err.errorType = constant.ERROR_TYPE.NOT_FOUND
        err.message = message.notFound
        resHndlr.sendError(res, err);
      });
  }

  public delete = async (req: Request, res: Response) => {
    await Device.findAndCountAll({
      where: {
        deviceProfileId: req.params.id
      }
    })
    .then((value:any)=>{
      if(value.count>0)
      {
        throw new Error("Firstly delete Devices Assosiated with this Device Profile");
      }
      else {
        this.baseModel.destroy({
          where: { id: req.params.id }
        })
          .then((removedRows: number) => {
            if (removedRows) {
              resHndlr.sendSuccess(res, removedRows);
            } else {
              throw new Error();
            }
          }).catch((err: any) => {
            err.errorType = constant.ERROR_TYPE.NOT_FOUND
            err.message = message.notFound
            resHndlr.sendError(res, err);
          })
      }
    })
    .catch((err:any)=>{
      logger.error(err.message);
      if(err.message=="Firstly delete Devices Assosiated with this Device Profile")
      {
        err =
        {
          errorType:constant.ERROR_TYPE.FORBIDDEN,
          message:err.message
        }

      }
      resHndlr.sendError(res, err);
    })
   
  }


}
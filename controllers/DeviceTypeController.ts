import { BaseController } from './BaseController'
import { Request, Response } from 'express'
import { DeviceProfile } from '../models/deviceProfile'
import { Device } from '../models/device'
import { DeviceType } from '../models/deviceType'
import sequelize from 'sequelize'
var Constant = require('../core/constants/constant')

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import constant from '../../../config/packages/bib-response-handler/constants'
import message from '../../../config/packages/bib-response-handler/messages'
import { logger } from '../utils/logger'

export class DeviceTypeController extends BaseController {

  constructor(public model: any) {
    super(model)
  }

  async readAll(req: Request, res: Response) {

    let { sortBy, sortOrder, organizationId, isOrgFilter } = req.query

    let page: number = Number(req.query.page)
    let limit: number = Number(req.query.limit)
    if (undefined == page || 0 == page || isNaN(page)) { page = Constant.defaultPage }
    if (undefined == limit || 0 == limit || isNaN(limit)) { limit = Constant.defaultLimit }
    if (undefined == sortBy) { sortBy = 'id' }
    if (undefined == sortOrder) { sortOrder = 'ASC' }

    let offset = +Math.abs(page - 1) * limit


    let query :any = { limit, offset, order: [[String(sortBy), String(sortOrder)]] }

    try {
      if (isOrgFilter) {
        let deviceTypes = await getDeviceTypes(organizationId!!.toString())
        resHndlr.sendSuccess(res, deviceTypes, constant.RESPONSE_STATUS.SUCCESS)
        return
      }
    }catch(error){
      logger.error('error ', error)
      resHndlr.sendError(res, error)
      return
    }

    DeviceType.findAndCountAll(query)
      .then((eventRange: any) => {
        resHndlr.sendSuccessWithMsg(res, eventRange)
      })
      .catch((err: any) => {
        resHndlr.sendError(res, err)
      })

  }

  create = async (req: Request, res: Response) => {
    let { deviceType } = req.body

    let checkDevice = await this.baseModel.findOne({ where: { deviceType: deviceType }, paranoid: false, raw: true })

    //restore soft-deleted data
    if (checkDevice) {

      if (checkDevice['deletedAt'] == null) {

        resHndlr.sendError(res, {
          errorType: constant.ERROR_TYPE.ALREADY_EXISTS,
          message: 'Device Type already exists'
        })

      } else {

        //update restored row
        this.baseModel.update(req.body, {
          fields: Object.keys(req.body),
          where: { deviceType: req.body.deviceType }
        })
          .then((affectedRows: [number, any]) => {

            if (affectedRows[0]) {
              this.baseModel.findOne({
                where: {
                  deviceType: deviceType
                },
              })
                .then((result: any) => {
                  resHndlr.sendSuccess(
                    res,
                    result,
                    constant.RESPONSE_STATUS.SUCCESS_CREATED,
                  );
                })
                .catch((err: any) => {
                  resHndlr.sendError(res, err);
                })

            }
            else {
              throw new Error();
            }
          })
          .catch((err: any) => {
            resHndlr.sendError(res, err);
          })

      }

    }
    else {

      this.baseModel.create(req.body)
        .then((eventRange: any) => {
          resHndlr.sendSuccess(
            res,
            eventRange,
            constant.RESPONSE_STATUS.SUCCESS_CREATED,
          );
        })
        .catch((err: any) => {
          logger.error("err", err);
          resHndlr.sendError(res, err);
        });
    }
  }

  read = (req: Request, res: Response) => {
    this.baseModel.findOne({
      where: {
        id: req.params.id
      },
      include: [
        { model: DeviceProfile },
        { model: Device }
      ]
    })
      .then((eventRange: any) => {
        if (eventRange) {
          resHndlr.sendSuccessWithMsg(res, eventRange)
        } else {
          throw new Error()
        }
      })
      .catch((err: any) => {
        err.errorType = constant.ERROR_TYPE.NOT_FOUND
        err.message = message.notFound
        resHndlr.sendError(res, err)
      })
  }

  public delete = async (req: Request, res: Response) => {
    await DeviceProfile.findAndCountAll({
      where: {
        deviceTypeId: req.params.id
      }
    })
      .then((value: any) => {
        if (value.count > 0) {
          throw new Error("Firstly delete Device Profile Assosiated with this Device Type");
        }
        else {
          Device.findAndCountAll({
            where: {
              deviceTypeId: req.params.id
            }
          })
            .then((value: any) => {
              if (value.count > 0) {
                throw new Error("Firstly delete Device Assosiated with this Device Type");
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
                    resHndlr.sendError(res, err)
                  })
              }
            })
            .catch((err: any) => {
              if (err.message == "Firstly delete Device Assosiated with this Device Type") {
                err =
                {
                  errorType: constant.ERROR_TYPE.FORBIDDEN,
                  message: err.message
                }

              }
              resHndlr.sendError(res, err)
            })
        }

      })
      .catch((err: any) => {
        if (err.message == "Firstly delete Device Profile Assosiated with this Device Type") {
          err =
          {
            errorType: constant.ERROR_TYPE.FORBIDDEN,
            message: err.message
          }

        }
        resHndlr.sendError(res, err)
      })
  }

}

// get Device Type with respect to organization.
async function getDeviceTypes(organizationId: string){

  try {

    return await Device.findAll({
      where: {
        organisationId: organizationId
      },
      include: [
        {
          model: DeviceType,
          attributes: [],
          required: true
        }
      ],
      attributes: [
        [sequelize.fn('distinct', sequelize.col('devicetype.id')), 'deviceTypeId'],
        'devicetype.deviceType'
      ],
      order: [sequelize.literal(`"devicetype"."deviceType"`)],
      raw: true
    })

  }catch(error){
    throw error
  }

}



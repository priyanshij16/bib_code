import { Request, Response } from 'express'
import { logger } from '../utils/logger'

import resHndlr from '../../../config/packages/bib-response-handler/resHandler'
import constant from '../../../config/packages/bib-response-handler/constants'
import message from '../../../config/packages/bib-response-handler/messages'

export class BaseController {
    public baseModel: any

    constructor(public models: any) {
       this.baseModel = models
       this.readAll= this.readAll.bind(this)
       this.create= this.create.bind(this)
       this.update= this.update.bind(this)
       this.read= this.read.bind(this)
       this.delete=this.delete.bind(this)
    }

    async readAll(req: Request, res: Response, query: any = {}) {
       await this.baseModel.findAll()
        .then((eventRange: any) => {
            resHndlr.sendSuccess(res, eventRange)
        })
        .catch((err: any) => {
            resHndlr.sendError(res, err)
        })
    }

   async read  (req: Request, res: Response)  {
       await this.baseModel.findByPk(req.params.id)
        .then((eventRange: any) => {
        if (eventRange) {
            logger.debug(eventRange.dataValues)
            resHndlr.sendSuccess(res, eventRange)
        }
        else
            throw new Error()

        }).catch((err: any) => {
            err.errorType = constant.ERROR_TYPE.NOT_FOUND
            err.message = message.notFound
            logger.error('err in read By id::::', err)
            resHndlr.sendError(res, err)
        })
    }

    async create  (req: Request, res: Response) {
       await  this.baseModel.create(req.body)
        .then((eventRange: any) => {
            logger.debug(eventRange.dataValues)
            resHndlr.sendSuccess(
                res,
                eventRange,
                constant.RESPONSE_STATUS.SUCCESS_CREATED
            )
        })
        .catch((err: any) => {
            logger.error("err", err);
            resHndlr.sendError(res, err)
        })
    }

   async update (req: Request, res: Response)  {

    await this.baseModel.update(req.body, {
        fields: Object.keys(req.body),
        where: { id: req.params.id }, paranoid: true
    }).then((affectedRows: [number, any]) => {
        if (affectedRows[0]) {
            resHndlr.sendSuccess(res, affectedRows)
        } else {
        resHndlr.sendError(res, {
            errorType: constant.ERROR_TYPE.NOT_FOUND,
            message: 'status type not found'
        })
        }
    }).catch((err: any) => {
        logger.error(err)
        resHndlr.sendError(res, {
            errorType: constant.ERROR_TYPE.ALREADY_EXISTS,
            message: 'status type is already exists'
        })
    })

    }

   async delete (req: Request, res: Response) {
       await this.baseModel.destroy({
            where: { id: req.params.id }
        })
        .then((removedRows: number) => {
            if (removedRows) 
             return resHndlr.sendSuccess(res, "Record Deleted Successfully ")
            else
             throw new Error()

        }).catch((err: any) => {
            err.errorType = constant.ERROR_TYPE.NOT_FOUND
            err.message = message.notFound
            resHndlr.sendError(res, err);
        })
    }
}
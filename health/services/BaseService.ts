import { Request, Response } from 'express'

export class BaseService{
    public baseModel: any

    constructor(public models: any) {
        this.baseModel = models
    }

    public async readAll(req: Request, res: Response, query: any = {}) {
        this.baseModel.findAndCountAll(query)
           
    }

    read = (req: Request, res: Response) => {
        this.baseModel.findByPk(req.params.id)
            
    }

    create = (req: Request, res: Response) => {
        this.baseModel.create(req.body)
           
    }

    update = (req: Request, res: Response) => {
        this.baseModel.update(req.body, {
            fields: Object.keys(req.body),
            where: { id: req.params.id }, paranoid: true
        })
    }

    delete = (req: Request, res: Response) => {
        this.baseModel.destroy({
            where: { id: req.params.id }
        })
           
    }
}
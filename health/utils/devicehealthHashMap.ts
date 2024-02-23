import { DeviceHealth } from "../models/deviceHealth";
import { logger } from "./logger";
import { HealthStatus } from "../models/healthStatus";
import { StatusType } from "../models/statusType";
import { CouchDBHandler } from "../../../config/packages/bib-couchDB/couchDBHandler";
import { couchHealthDBConstants } from "../core/constants/constant";

class HealthHashMap {
    deviceHealthHashMap = new Map()
    healthStatusHashMap = new Map()
    private static _instance: HealthHashMap

    constructor() {
        DeviceHealth.findAll()
            .then(async (devicehealth) =>{
                devicehealth.map(async (el) => {
                    let key = `${el?.deviceId}_${el?.partId}_${el?.partInstanceId}`
                    if(process.env.useHashMaps)
                        this.deviceHealthHashMap.set(key, {
                            updatedAt: el?.updatedAt,
                            statusId: el?.statusId
                        })
                    else if(process.env.isServiceNode || process.env.ALLNODE){
                        await healthModuleCache.insertDocument({
                            _id: key,
                            cacheName: couchHealthDBConstants.deviceHealth,
                            updatedAt: el?.updatedAt,
                            statusId: el?.statusId
                        },true)
                    }
                })
            })
            .catch((err: any) => {
                logger.error("failed to create map for device health",err)
            });
        HealthStatus.findAll(
            {
                attributes: ['id',],
                include:
                [{
                    model: StatusType,
                    as: 'statusType',
                    attributes: ['type']
                }]
            })
            .then(async (healthStatus) => {
                let statusArray: any = []

                healthStatus.map(async (el: any) => {
                    if(el?.statusType?.type?.toLowerCase() == 'error' || el?.statusType?.type?.toLowerCase() == 'warning')
                        statusArray.push(el?.id)
                })
                if(process.env.useHashMaps)
                    this.healthStatusHashMap.set('excludedStatusIds', {
                        statusList: statusArray
                    })
                else if(process.env.isServiceNode || process.env.ALLNODE){
                    await healthModuleCache.insertDocument({
                        _id: "excludedStatusIds",
                        cacheName: couchHealthDBConstants.healthStatus,
                        statusList: statusArray
                    })
                }
            })
            .catch((err: any) => {
                logger.error("failed to create map for health status",err)
            })
    }

    public static get Instance() {
        return this._instance || (this._instance = new this())
    }

}


export const deviceHealthHashMapInstance = HealthHashMap.Instance

class HealthModuleCache extends CouchDBHandler{
    constructor(dbName: any){
        super(dbName);
    }
}

export let healthModuleCache = HealthModuleCache.getInstance(couchHealthDBConstants.cacheName)
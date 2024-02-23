import { Router } from 'express'
import { DeviceHealthHistoryController } from '../controllers/DeviceHealthHistoryController'
import { DeviceHealthHistory } from '../models/deviceHealthHistory'
import { DeviceRuleController } from '../controllers/DeviceRuleController'
import { DeviceRule } from '../models/deviceRule'
import { DeviceHealthController } from '../controllers/DeviceHealthController'
import { DeviceHealth } from '../models/deviceHealth'
import { ServiceHealthController } from '../controllers/ServiceHealthController'
import { ServiceHealth } from '../models/serviceHealth'
import { HealthStatusController } from '../controllers/HealthStatusController'
import { HealthStatus } from '../models/healthStatus'
import { StatusType } from '../models/statusType'
import { StatusTypeController } from '../controllers/StatusTypeController'
import { serviceHealthValidate } from '../core/validators/serviceHealth'
import { deviceRuleValidate } from '../core/validators/deviceRule'
import { deviceHealthHistoryValidate } from '../core/validators/deviceHealthHistory'
import { statusTypeValidate } from '../core/validators/statusType'
import { healthStatusValidate } from '../core/validators/Healthstatus'
import { deviceHealthValidate } from '../core/validators/deviceHealth'
class MainRouter {
  router: Router
  deviceHealthController: DeviceHealthController
  healthStatusController: HealthStatusController
  statusTypeController: StatusTypeController
  deviceHealthHistoryController: DeviceHealthHistoryController
  serviceHealthController: ServiceHealthController
  serviceHealth = ServiceHealth
  deviceHealthHistory = DeviceHealthHistory
  deviceRuleController: DeviceRuleController
  deviceRule = DeviceRule
  healthStatus = HealthStatus
  statusType = StatusType
  deviceHealth = DeviceHealth

  constructor() {
    // Initialize controllers objects

    this.deviceHealthController = new DeviceHealthController(this.deviceHealth)

    this.deviceHealthHistoryController = new DeviceHealthHistoryController(this.deviceHealthHistory)
    this.deviceRuleController = new DeviceRuleController(this.deviceRule)
    this.statusTypeController = new StatusTypeController(this.statusType)
    this.serviceHealthController = new ServiceHealthController(this.serviceHealth)
    this.healthStatusController = new HealthStatusController(this.healthStatus)
    this.router = Router({ mergeParams: true })
    this.healthStatusRoutes()
    this.serviceHealthRoutes()
    this.statusTypeRoutes()
    this.deviceRuleRoutes()
    this.deviceHealthRoutes()
    this.deviceHealthHistoryRoutes()
  }

  private serviceHealthRoutes() {
    this.router
      .route('/api/v1/serviceHealth')
      .get(

        this.serviceHealthController.readAll,
      )
      .post(
        serviceHealthValidate.makeValidation('store'),
        this.serviceHealthController.create,
      )


    this.router
      .route('/api/v1/serviceHealth/:id')
      .get(this.serviceHealthController.read)

  }

  private deviceRuleRoutes() {
    this.router
      .route('/api/v1/deviceRule')
      .get(this.deviceRuleController.readAll)
      .post(
        deviceRuleValidate.makeValidation('store'),
        this.deviceRuleController.create,
      )

    this.router
      .route('/api/v1/deviceRule/:id')
      .get(deviceRuleValidate.makeValidation('view'), this.deviceRuleController.read)

      .put(
        deviceRuleValidate.makeValidation('update'),
        this.deviceRuleController.update,
      )
      .delete(deviceRuleValidate.makeValidation('delete'), this.deviceRuleController.delete)
  }

  private deviceHealthRoutes() {
    this.router
      .route('/api/v1/deviceHealth')
      .get(
        deviceHealthValidate.makeValidation('index'),
        this.deviceHealthController.read,
      )
      .post(
        deviceHealthValidate.makeValidation('store'),
        this.deviceHealthController.store
      )
      .put(
        deviceHealthValidate.makeValidation('update'),
        this.deviceHealthController.update
      )

    this.router
      .route('/api/v1/allDeviceHealth')
      .get(this.deviceHealthController.readAll)
      
    this.router
      .route('/api/v1/deviceHealthAxios')
      .post(
        deviceHealthValidate.makeValidation('index'),
        this.deviceHealthController.read,
      )
  }

  private deviceHealthHistoryRoutes() {
    this.router
      .route('/api/v1/deviceHealthHistory')
      .get(

        this.deviceHealthHistoryController.readAll,
      )

      .post(
        deviceHealthHistoryValidate.makeValidation('store'),
        this.deviceHealthHistoryController.create)

    this.router
      .route('/api/v1/deviceHealthHistory/:id')
      .get(this.deviceHealthHistoryController.read)


  }

  private healthStatusRoutes() {
    this.router
      .route('/api/v1/healthStatus')
      .get(
        this.healthStatusController.readAll,
      )
      .post(
        healthStatusValidate.makeValidation('store'),
        this.healthStatusController.store)

      .patch(
        healthStatusValidate.makeValidation('storeOrUpdate'),
        this.healthStatusController.storeOrUpdate
      )

    this.router
      .route('/api/v1/healthStatus/:id')
      .get(
        healthStatusValidate.makeValidation('view'),
        this.healthStatusController.read)
      .put(
        healthStatusValidate.makeValidation('update'),
        this.healthStatusController.update
      )
      .delete(
        healthStatusValidate.makeValidation('delete'),
        this.healthStatusController.delete
      )


  }

  private statusTypeRoutes() {
    this.router
      .route('/api/v1/healthStatusType')
      .get(this.statusTypeController.readAll)
      .post(
        statusTypeValidate.makeValidation('store'),
        this.statusTypeController.store
      )

    this.router
      .route('/api/v1/healthStatusType/:id')
      .get(
        statusTypeValidate.makeValidation('view'),
        this.statusTypeController.read
      )
      .put(
        statusTypeValidate.makeValidation('update'),
        this.statusTypeController.update
      )
      .delete(
        statusTypeValidate.makeValidation('delete'),
        this.statusTypeController.delete
      )
  }
}

export default new MainRouter().router

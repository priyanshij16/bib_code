
import sequelize, { DataTypes, Model, json } from 'sequelize'
import { Device } from './device'
import database from '../config/db'
import { HealthStatus } from './healthStatus'
import { StatusType } from './statusType'
import { Part } from './part'

// Database connection instance
let healthDatabaseInstance = database

export enum Criticality {
  high = 'high',
  low = 'low'

}

// User Interface
export interface DeviceRuleInterface {
  id?: number
  deviceId: string
  partId: number
  criticality: Criticality
  statusId: number
  overRideStatus: string
}

export class DeviceRule extends Model<DeviceRuleInterface> implements DeviceRuleInterface {
  declare id?: number
  declare deviceId: string
  declare partId: number
  declare criticality: Criticality
  declare statusId: number
  declare overRideStatus: string
}

DeviceRule.init(
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },

    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    partId: {
      type: DataTypes.INTEGER,
    },

    statusId: {
      type: DataTypes.INTEGER,
    },

    overRideStatus: {
      type: DataTypes.INTEGER
    },

    criticality: {
      type: DataTypes.ENUM('high', 'low'),
      defaultValue: 'high'
    }

  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'deviceRule'
  }
)


DeviceRule.belongsTo(Device, {
  foreignKey: 'deviceId',
  targetKey: 'id',
  constraints: true
})

Device.hasMany(DeviceRule, {
  foreignKey: 'deviceId',
  sourceKey: 'id',
  constraints: true
})

DeviceRule.belongsTo(HealthStatus, {
  foreignKey: 'statusId',
  targetKey: 'id',
  constraints: true
})

HealthStatus.hasMany(DeviceRule, {
  foreignKey: 'statusId',
  sourceKey: 'id',
  constraints: true
})

DeviceRule.belongsTo(Part, {
  foreignKey: 'partId',
  targetKey: 'id',
  constraints: true
})

Part.hasMany(DeviceRule, {
  foreignKey: 'partId',
  sourceKey: 'id',
  constraints: true
})

DeviceRule.belongsTo(StatusType, {
  foreignKey: 'overRideStatus',
  targetKey: 'id',
  constraints: true
})

StatusType.hasMany(DeviceRule, {
  foreignKey: 'overRideStatus',
  sourceKey: 'id',
  constraints: true
})
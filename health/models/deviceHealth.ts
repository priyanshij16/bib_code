import sequelize, { DataTypes, Model, json } from 'sequelize'
import { Device } from './device'
import database from '../config/db'
import { DevicePart } from './devicePart'
import { StatusType } from './statusType'
import { Part } from './part'
import { HealthStatus } from './healthStatus'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface DeviceHealthInterface {
  id?: number
  deviceId: string
  partId: number
  statusId: number
  info?: any
  eventId?: number
  partInstanceId: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  organizationId: string
}

export interface DeviceHealth extends Model<DeviceHealthInterface>, DeviceHealthInterface {}
// interface define structure of data and class resprsent Model 
export class DeviceHealth extends Model <DeviceHealthInterface> implements DeviceHealthInterface {
  declare id?: number
  declare deviceId: string
  declare partId: number
  declare statusId: number
  declare info?: any
  declare eventId?: number
  declare partInstanceId: number
  declare createdAt: Date
  declare updatedAt: Date
  declare deletedAt?: Date
  declare organizationId: string
}

DeviceHealth.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },

    partInstanceId: {
      type: DataTypes.INTEGER,
    },

    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    deviceId: {
      type: DataTypes.UUID,
      allowNull:false
    },

    partId: {
      type: DataTypes.INTEGER,
      allowNull:false
    },

    statusId: {
      type: DataTypes.INTEGER,
    },

    info: {
      type: DataTypes.JSONB,
      defaultValue:{}
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },

    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true
    },

    organizationId: {
      type: DataTypes.UUID,
      defaultValue: null,
      allowNull: true
    }

  }, 
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'deviceHealth'
  }
)

DeviceHealth.belongsTo(Device, {
  foreignKey: 'deviceId',
  targetKey: 'id',
  constraints: true
})

Device.hasMany(DeviceHealth, {
  foreignKey: 'deviceId',
  sourceKey: 'id',
  constraints: true
})

DeviceHealth.belongsTo(StatusType, {
  foreignKey: 'statusId',
  targetKey: 'id',
  constraints: true
})

StatusType.hasMany(DeviceHealth, {
  foreignKey: 'statusId',
  sourceKey: 'id',
  constraints: true
})

DeviceHealth.belongsTo(Part, {
  foreignKey: 'partId',
  targetKey: 'id',
  constraints: true
})

Part.hasMany(DeviceHealth, {
  foreignKey: 'partId',
  sourceKey: 'id',
  constraints: true
})

DeviceHealth.belongsTo(HealthStatus, {
  foreignKey: 'statusId',
  targetKey: 'id',
});
import sequelize, { DataTypes, Model, json } from 'sequelize'
import { Device } from './device'
import database from '../config/db'
import { DevicePart } from './devicePart'
import { HealthStatus } from './healthStatus'
import { Part } from './part'



// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface DeviceHealthHistoryInterface {
  id?: number
  deviceId: string
  statusId: number
  partId: number
  info: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export class DeviceHealthHistory extends Model<DeviceHealthHistoryInterface> implements DeviceHealthHistoryInterface {
  declare id?: number
  declare deviceId: string
  declare statusId: number
  declare partId: number
  declare info: string
  declare createdAt?: Date
  declare updatedAt?: Date
  declare deletedAt?: Date
}

DeviceHealthHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    info: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },

    deviceId: {
      type: DataTypes.UUID
    },

    statusId: {
      type: DataTypes.INTEGER
    },

    partId: {
      type: DataTypes.INTEGER
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
  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'deviceHealthHistory'
  })

DeviceHealthHistory.belongsTo(Device, {
  foreignKey: 'deviceId',
  targetKey: 'id',
  constraints: true
})

Device.hasMany(DeviceHealthHistory, { // hasmany >> one toMany rs 
  foreignKey: 'deviceId', // 
  sourceKey: 'id', // specify col in device model 
  constraints: true // sq add foreign key constraints to associated models 
})

DeviceHealthHistory.belongsTo(HealthStatus, {
  foreignKey: 'statusId',
  targetKey: 'id',
  constraints: true
})

HealthStatus.hasMany(DeviceHealthHistory, {
  foreignKey: 'statusId',
  sourceKey: 'id',
  constraints: true
})

DeviceHealthHistory.belongsTo(Part, {
  foreignKey: 'partId',
  targetKey: 'id',
  constraints: true
})

Part.hasMany(DeviceHealthHistory, {
  foreignKey: 'partId',
  sourceKey: 'id',
  constraints: true
})

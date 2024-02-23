
import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'


// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface DevicePartInterface {
  id?: number,
  deviceId: string,
  partId: number,
}

export class DevicePart extends Model<DevicePartInterface> implements DevicePartInterface {
  declare id?: number
  declare deviceId: string
  declare partId: number
}

DevicePart.init(
  {
    deviceId: {
      type: DataTypes.UUID
    },
    partId: {
      type: DataTypes.INTEGER
    }

  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'deviceParts'
  }
)
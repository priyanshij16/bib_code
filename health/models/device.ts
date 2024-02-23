import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface DeviceInterface {
  id?: string
  lcDeviceId?: string
  hierarchyId: string
  organisationId: string
}

export class Device extends Model<DeviceInterface> implements DeviceInterface {
  declare id?: string
  declare hierarchyId: string
  declare organisationId: string
}

Device.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    lcDeviceId: {
      type: sequelize.UUID,
      unique: true,
      allowNull: true
    },

    hierarchyId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    organisationId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
  timestamps: false,
  freezeTableName: true, // it will give same name for Table in database . model_name=Table_name 
  sequelize: healthDatabaseInstance,
  modelName: 'device'
}
)
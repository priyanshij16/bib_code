import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface ServiceInterface {
  id?: string
  name: string
  description: string
}

export class Service extends Model<ServiceInterface> implements ServiceInterface {
  declare id?: string
  declare name: string
  declare description: string
}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false

    },
    description: {
      type: DataTypes.TEXT
    }
  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'service'
  }
)

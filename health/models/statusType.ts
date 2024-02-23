import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface statusTypeInterface {
  id?: number
  type: string
  priority: number
}

export class StatusType extends Model<statusTypeInterface> implements statusTypeInterface {
  declare id?: number
  declare type: string
  declare priority: number
}

StatusType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'statusType'
  }

)

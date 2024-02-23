import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'
import { StatusType } from './statusType'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface HealthStatusInterface {
  id?: number
  type: number
  description: string
}

export class HealthStatus extends Model<HealthStatusInterface> implements HealthStatusInterface {
  declare id?: number
  declare type: number
  declare description: string
}


HealthStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    type: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.TEXT
    }

  },
  {
    timestamps: false,
    freezeTableName: true,
    sequelize: healthDatabaseInstance,
    modelName: 'healthStatus'
  }

)

HealthStatus.belongsTo(StatusType, {
  foreignKey: 'type',
  targetKey: 'id',
  constraints: true,
})

StatusType.hasMany(HealthStatus, {
  foreignKey: 'type',
  sourceKey: 'id',
  constraints: true,
})

import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'
import { HealthStatus } from './healthStatus'
import { Service } from './service'


// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface ServiceHealthInterface {
  id?: number
  serviceId: string
  statusId: Number
  info: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date
}

export class ServiceHealth extends Model<ServiceHealthInterface> implements ServiceHealthInterface {
  declare id?: number
  declare serviceId: string
  declare statusId: Number
  declare info: string
  declare createdAt: Date
  declare updatedAt: Date
  declare deletedAt: Date
}

ServiceHealth.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    info: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },

  }, {
  timestamps: false,
  freezeTableName: true,
  sequelize: healthDatabaseInstance,
  modelName: 'serviceHealth'
}
)

ServiceHealth.belongsTo(Service, {
  foreignKey: 'serviceId',
  targetKey: 'id',
  constraints: true,
})
Service.hasMany(ServiceHealth, {
  foreignKey: 'serviceId',
  sourceKey: 'id',
  constraints: true,
})

ServiceHealth.belongsTo(HealthStatus, {
  foreignKey: 'statusId',
  targetKey: 'id',
  constraints: true,
})
HealthStatus.hasMany(ServiceHealth, {
  foreignKey: 'statusId',
  sourceKey: 'id',
  constraints: true,
})

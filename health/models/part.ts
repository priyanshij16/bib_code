import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'
import { Device } from './device'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface PartInterface {
  id: string
  name: string
  manufacture: string,
  model: string,
  partParentId: number,
  notes: string
}

export class Part extends Model<PartInterface> implements PartInterface {
  declare id: string
  declare name: string
  declare manufacture: string
  declare model: string
  declare partParentId: number
  declare notes: string
}

Part.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },

  name: {
    type: DataTypes.STRING
  },

  manufacture: {
    type: DataTypes.STRING
  },

  model: {
    type: DataTypes.STRING
  },

  partParentId: {
    type: DataTypes.INTEGER
  },

  notes: {
    type: DataTypes.STRING
  }

},
  {
    freezeTableName: true,
    timestamps: false,
    sequelize: healthDatabaseInstance,
    modelName: 'part'
  }
)


Part.belongsToMany(Device, { through: 'devicePart' })
Device.belongsToMany(Part, { through: 'devicePart' })
import sequelize, { DataTypes, Model, json } from 'sequelize'
import database from '../config/db'

// Database connection instance
let healthDatabaseInstance = database

// User Interface
export interface OrganizationSeverityInterface {
    id?: string
    eventId: number,
    severity: string,
    organizationId: string
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
}

export class OrganizationSeverity extends Model<OrganizationSeverityInterface> implements OrganizationSeverityInterface {
    declare id?: string
    declare eventId: number
    declare severity: string
    declare organizationId: string
    declare createdAt?: Date
    declare updatedAt?: Date
    declare deletedAt?: Date
}

OrganizationSeverity.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        severity: {
            type: DataTypes.STRING,
            allowNull: false
        },

        organizationId: {
            type: DataTypes.UUID,
            allowNull: false
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
        }
    },
    {
        timestamps: false,
        freezeTableName: true,
        sequelize: healthDatabaseInstance,
        modelName: 'organizationSeverity'
    }
)
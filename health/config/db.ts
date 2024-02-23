// import sequelize from 'sequelize'
import sequelize,{Sequelize} from 'sequelize'
import path from 'path'
const Umzug = require('umzug');
import dotenv from 'dotenv'
import { logger } from '../utils/logger'
import { noOfWorker } from '../../../config/constant';
dotenv.config()
let workers = noOfWorker ?? 1

class HealthDatabase {
  db: string
  user: string
  password: string
  host: string
  port: number
  maxPool: number
  minPool: number
  database: sequelize.Sequelize

  constructor() {
    this.db = process.env.HEALTH_DB_NAME || 'nglc_monolothic_health'
    this.user = process.env.DB_USER || 'postgres'
    this.password = process.env.DB_PASS || '123456'
    this.host = process.env.DB_HOST || '127.0.0.1'
    this.port = 5432
    this.maxPool = Number(process.env.MAX_POOL_health) || 10
    this.minPool = 1
    this.maxPool = Math.round(this.maxPool/workers)
    this.database = new Sequelize(this.db, this.user, this.password, {
      host: this.host,
      ssl : true,
      dialect: 'postgres',
      dialectOptions: {
        encrypt: true,
      },
      port: this.port,
      logging: false,
      // operatorsAliases: false,
      pool: {
        max: this.maxPool,
        min: this.minPool,
        acquire: Number(process.env.ACQUIRE_TIME) || 30000,
        idle: Number(process.env.IDLE_TIME) || 10000,
        evict: Number(process.env.EVICT_TIME) || 1000
      },
    })

    this.database
      .authenticate()
      .then(() => {
        logger.info('Connection has been established successfully ( health) .')
        migrate
          .up()
          .then((result: any) => {

            logger.debug('All migrations performed successfully ( health)')
            seed
              .up()
              .then((onSeed: any) => {
                logger.debug('Data seed successfull. ( health )')
              })
              .catch((err: any) => {

                logger.error('Seeder failed (health)')
              })
          })
          .catch((err: any) => {
            logger.error(err, "this is the errror")
            logger.error('Migration failed ( health)')
          })
      })
      .catch((err) => {
        logger.error('Unable to connect to the database: ( health )')
      })
  }
}

let healthDatabaseInstance = new HealthDatabase().database

const migrate = new Umzug({
  migrations: {
    // indicates the folder containing the migration .js files
    path: path.join(__dirname, '../migrations'),
    pattern: /\.js$/,
    // inject sequelize's QueryInterface in the migrations
    params: [healthDatabaseInstance.getQueryInterface(), sequelize],
  },
  // indicates that the migration data should be store in the database
  // itself through sequelize. The default configuration creates a table
  // named `SequelizeMeta`.
  storage: 'sequelize',
  storageOptions: {
    sequelize: healthDatabaseInstance,
  },
})

const seed = new Umzug({
  migrations: {
    // indicates the folder containing the migration .js files
    path: path.join(__dirname, '../seeders'),
    pattern: /\.js$/,
    // inject sequelize's QueryInterface in the migrations
    params: [healthDatabaseInstance.getQueryInterface(), sequelize],
  },
  // indicates that the migration data should be store in the database
  // itself through sequelize. The default configuration creates a table
  // named `SequelizeMeta`.
  storage: 'sequelize',
  storageOptions: {
    sequelize: healthDatabaseInstance,
  },
})

export default healthDatabaseInstance

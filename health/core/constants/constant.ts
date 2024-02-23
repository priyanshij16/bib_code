import path from 'path'
export const ROOT_DIR = path.join(__dirname, '../../../../../')
export const defaultLimit = 100
export const defaultPage = 1
export const KEY = 'health'
export const SERVICE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTUzMjc2MzIsImlhdCI6MTY2MDYzMzIzMn0.SLPk86TJrGt4Q9zmnCnxKqGcG9JTFZMYEDxiyY0ajyQ'

export let couchHealthDBConstants = {
  cacheName: "healthcache",
  deviceHealth: "deviceHealth",
  healthStatus: "healthStatus"
}
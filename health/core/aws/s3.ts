import S3 from 'aws-sdk/clients/s3'
import { Request , Response } from 'express'
import { Workbook } from 'exceljs'
import { logger } from '../../utils/logger'
import resHndlr from '../../../../config/packages/bib-response-handler/resHandler'

function s3Connection() {

    try {
      let s3Connect = new S3({
        region: process.env.S3_REGION,
        accessKeyId: process.env.S3_USER_KEY,
        secretAccessKey: process.env.S3_USER_SECRET,
      })
      return s3Connect
    } catch (err) {
      return err.message
    }
}

export async function uploadReportToS3(hashMap: any, fileName: string) {
    try {
  
      let uploadParams = {
        Bucket: process.env.S3_NAME,
        Body: hashMap,
        Key: `hashMap/${fileName}`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
  
      let response = await s3Connection().upload(uploadParams).promise()
  
      return Promise.resolve(fileName)

    } catch (err) {
      console.trace('err:', err)
      logger.error('error in uploading hashmap to S3 bucket ::', err)
      return Promise.reject(err)
    }
}
import { deviceHealthHashMapInstance } from "./devicehealthHashMap";
import { logger } from "../../../utils/logger";
import v8 from "v8";
import ExcelJS from "exceljs";
import * as schedule from "node-schedule";
import moment from "moment";
import { uploadReportToS3 } from "../core/aws/s3";
let hashMapName = 'deviceHealthHashMap'

class HashMapSizes {
  resultMap: { [key: string]: {} } = {};
  constructor() {
    this.scheduleJob();
  }

  private async scheduleJob() {
    schedule.scheduleJob("*/30 * * * *", async () => {
      try {
        await this.iterateHashMaps(deviceHealthHashMapInstance);
        logger.info("The size of every HashMap in every 30mins ",this.resultMap);
      } catch (err) {
        logger.error("Error in scheduling the job for hashMap size dump", err);
      }
    });
  }

  async iterateHashMaps(hashMapInstance: any) {
    try {
      let mapSize = await this.getMapSize(hashMapName,hashMapInstance);
      await this.fileExecution(mapSize);
    } catch (err) {
      logger.error("Error in iterating the hashMapInstance", err);
    }
  }

  getMapSize(mapName: string, hashMap: any) {
    try {
      const map = (hashMap as any)[mapName];
      if (map instanceof Map) {
        this.resultMap[mapName] = map.size;
        return map.size;
      } else {
        logger.info(`${mapName} is not a Map.`);
      }
    } catch (err) {
      logger.error(`Error in getting the map size for hashMap ${mapName}`, err);
    }
  }

  async fileExecution(mapSize: any) {
    let currentDate = moment();
    const currentTime = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    // Add headers
    let titleRow = worksheet.addRow([`DeviceHealthHashmap Size: ${mapSize}`]);
    titleRow.font = { bold: true };
    titleRow.alignment = { horizontal: "center" };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF808080' }
    };
    let dataHeaderRow = worksheet.addRow(["Key", "Value"]);
    dataHeaderRow.font = { bold: true };
    dataHeaderRow.alignment = { horizontal: "center" };

    const allData = Array.from(
      deviceHealthHashMapInstance.deviceHealthHashMap.entries()
    );

    for (const [key, value] of allData) {
      worksheet.addRow([key, JSON.stringify(value)]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    let fileName = `deviceHealthHashMapDump${currentTime}.xlsx`;

    await uploadReportToS3(buffer, fileName);
  }
}

export const hashMapSizes = new HashMapSizes();

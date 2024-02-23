import { Part, PartInterface } from '../models/part'
import { logger } from '../utils/logger'

export class PartController {
  private static partInstance: PartController
  constructor() {}

  public async store(part: PartInterface) {
    try {
      let existing = await Part.findByPk(part.id, { paranoid: false })
      if (existing) {
        return await Part.update(part, {
          where: { id: existing.id!! },
        })
      }
      return await Part.create(part);
    } catch (err) {
      logger.debug("partController error in storing device", err)
    }
  }

  async delete(ids: number[]) {
    try {
      return await Part.destroy({
        where: {
          id: ids,
        },
      });
    } catch (error) {
      logger.debug("err in deleting device", error.message)
    }
  }

  public static get Instance() {
    return this. partInstance || (this. partInstance = new this());
  }
}

export const partControllerInstance = PartController.Instance;

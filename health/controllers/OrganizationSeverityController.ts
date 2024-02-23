import databaseInstance from '../config/db'
import { OrganizationSeverity } from '../models/organizationSeverity'
import { logger } from '../utils/logger'

export class OrganizationSeverityController {

    async storeOrUpdate(data: any) {

        const _transaction = await databaseInstance.transaction()

        let severity = data.severity
        let eventId = data.eventId
        let organizationId = data.organizationId

        try {

            let checkSeverity = await OrganizationSeverity.findOne({
                where: {
                    eventId: eventId,
                    organizationId: organizationId
                },
                raw: true,
                transaction: _transaction
            })

            if (!checkSeverity) {

                try {

                    let createSeverity = {
                        severity,
                        eventId,
                        organizationId
                    }

                    await OrganizationSeverity.create(createSeverity, {
                        transaction: _transaction
                    })

                    // await _transaction.commit()

                } catch (err) {
                    logger.error(`Something went wrong while creating organization severity`, err)
                    throw err
                }

            } else {

                let updateSeverity = {
                    severity: severity
                }

                try {
                    await OrganizationSeverity.update(updateSeverity, {
                        where: {
                            eventId: eventId,
                            organizationId: organizationId
                        },
                        transaction: _transaction
                    })

                } catch (err) {
                    logger.error(`Something went wrong while updating organization severity`, err)
                    throw err
                }

            }
            await _transaction.commit()

        } catch (err) {
            logger.error('Something went wrong in orgSeverity storeOrUpdate ', err)
            await _transaction.rollback()
            throw err
        }

    }
}

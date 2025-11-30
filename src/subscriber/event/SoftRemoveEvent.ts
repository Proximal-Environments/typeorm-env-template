import { ObjectLiteral } from "../../common/ObjectLiteral"
import { Connection } from "../../connection/Connection"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { EntityManager } from "../../entity-manager/EntityManager"
import { EntityMetadata } from "../../metadata/EntityMetadata"

/**
 * SoftRemoveEvent is an object that stores all information about the entity that is being soft-removed.
 */
export interface SoftRemoveEvent<Entity> {
    /**
     * Connection used in the event.
     */
    connection: Connection

    /**
     * QueryRunner used in the event transaction.
     * All database operations in the subscribed event listener should be performed using this query runner instance.
     */
    queryRunner: QueryRunner

    /**
     * EntityManager used in the event transaction.
     * All database operations in the subscribed event listener should be performed using this entity manager instance.
     */
    manager: EntityManager

    /**
     * Entity that is being soft-removed.
     * This may be absent if the entity is being soft-removed by ID.
     */
    entity?: Entity

    /**
     * Metadata of the entity that is being soft-removed.
     */
    metadata: EntityMetadata

    /**
     * Database representation of the entity that is being soft-removed.
     */
    databaseEntity?: Entity

    /**
     * Id or ids of the entity that is being soft-removed.
     */
    entityId?: ObjectLiteral
}

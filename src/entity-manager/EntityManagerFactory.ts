import { DataSource } from "../data-source/DataSource"
import { EntityManager } from "./EntityManager"
import { MongoEntityManager } from "./MongoEntityManager"
import { QueryRunner } from "../query-runner/QueryRunner"

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection: DataSource, queryRunner?: QueryRunner): EntityManager {
        if (connection.driver.options.type === "mongodb")
            return new MongoEntityManager(connection)

        return new EntityManager(connection, queryRunner)
    }
}

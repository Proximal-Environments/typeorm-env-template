import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { BetterSqlite3Driver } from "./BetterSqlite3Driver"

/**
 * Runs queries on a single sqlite database connection.
 */
export class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: BetterSqlite3Driver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: BetterSqlite3Driver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF`)
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = ON`)
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const connection = this.driver.connection
        const broadcaster = this.broadcaster

        if (!connection.isInitialized) {
            throw new ConnectionIsNotSetError("better-sqlite3")
        }

        const databaseConnection = this.driver.databaseConnection

        this.driver.connection.logger.logQuery(query, parameters, this)
        await broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()

        const queryStartTime = Date.now()
        let result: any = new QueryResult()
        let stmt: any

        try {
            stmt = databaseConnection.prepare(query)
            if (parameters) {
                stmt = stmt.bind(...parameters)
            }

            // better-sqlite3 distinguishes between run() and all()/get()
            // run() is for INSERT, UPDATE, DELETE
            // all() is for SELECT
            // however, we don't always know what kind of query it is just by looking at the string
            // (e.g. it could be a PRAGMA or a stored procedure call)
            // fortunately, better-sqlite3 statements have a 'reader' property that tells us if it returns data

            if (stmt.reader) {
                const rows = stmt.all()
                result.raw = rows
                result.records = rows
            } else {
                const runResult = stmt.run()
                result.raw = runResult.lastInsertRowid
                result.affected = runResult.changes
            }

            // log slow queries if maxQueryExecution time is set
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            )
                connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )

            await broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                result.raw,
                undefined,
            )

            if (useStructuredResult) {
                return result
            } else {
                return result.raw
            }
        } catch (err) {
            connection.logger.logQueryError(err, query, parameters, this)
            await broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                false,
                undefined,
                undefined,
                err,
            )

            throw new QueryFailedError(query, parameters, err)
        } finally {
            await broadcasterResult.wait()
        }
    }
}

import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface BetterSqlite3ConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "better-sqlite3"

    /**
     * Storage type or path to the storage.
     */
    readonly database: string

    /**
     * The driver object
     * This defaults to require("better-sqlite3")
     */
    readonly driver?: any

    /**
     * Encryption key for for SQLCipher.
     */
    readonly key?: string

    /**
     * Enables WAL mode. By default its disabled.
     *
     * @see https://www.sqlite.org/wal.html
     */
    readonly enableWAL?: boolean



    readonly poolSize?: never

    /**
     * Query or change the setting of the busy timeout.
     * Time in milliseconds.
     *
     * @see https://www.sqlite.org/pragma.html#pragma_busy_timeout
     */
    readonly busyTimeout?: number

    /**
     * Function to run before a query is executed.
     */
    readonly prepareDatabase?: (db: any) => void
}

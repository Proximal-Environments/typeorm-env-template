import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Better-Sqlite3-specific connection options.
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

    /**
     * Specifies the open file flags. By default its undefined.
     */
    readonly readonly?: boolean

    /**
     * Specifies the open file flags. By default its undefined.
     */
    readonly fileMustExist?: boolean

    /**
     * Timeout for waiting for the database to be unlocked.
     */
    readonly timeout?: number

    /**
     * If set, verbose execution information will be printed to the console.
     */
    readonly verbose?: Function

    /**
     * If set, the database will be opened in memory.
     */
    readonly memory?: boolean

    /**
     * If set, the database will be opened in native mode.
     */
    readonly nativeBinding?: string

    readonly poolSize?: never
}

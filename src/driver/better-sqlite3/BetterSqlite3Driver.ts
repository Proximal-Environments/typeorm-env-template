import fs from "fs/promises"
import path from "path"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { BetterSqlite3QueryRunner } from "./BetterSqlite3QueryRunner"
import { PlatformTools } from "../../platform/PlatformTools"
import { DataSource } from "../../data-source/DataSource"
import { BetterSqlite3ConnectionOptions } from "./BetterSqlite3ConnectionOptions"
import { ColumnType } from "../types/ColumnTypes"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { ReplicationMode } from "../types/ReplicationMode"
import { filepathToName, isAbsolute } from "../../util/PathUtils"

/**
 * Organizes communication with sqlite DBMS.
 */
export class BetterSqlite3Driver extends AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: BetterSqlite3ConnectionOptions

    /**
     * SQLite underlying library.
     */
    sqlite: any

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super(connection)
        this.connection = connection
        this.options = connection.options as unknown as BetterSqlite3ConnectionOptions
        this.database = this.options.database

        // load sqlite package
        this.loadDependencies()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            try {
                this.queryRunner = undefined
                this.databaseConnection.close()
                ok()
            } catch (error) {
                fail(error)
            }
        })
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new BetterSqlite3QueryRunner(this)

        return this.queryRunner
    }

    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        if ((column.type as any) === Buffer) {
            return "blob"
        }

        return super.normalizeType(column)
    }

    async afterConnect(): Promise<void> {
        return this.attachDatabases()
    }

    /**
     * For SQLite, the database may be added in the decorator metadata. It will be a filepath to a database file.
     */
    buildTableName(
        tableName: string,
        _schema?: string,
        database?: string,
    ): string {
        if (!database) return tableName
        if (this.getAttachedDatabaseHandleByRelativePath(database))
            return `${this.getAttachedDatabaseHandleByRelativePath(
                database,
            )}.${tableName}`

        if (database === this.options.database) return tableName

        // we use the decorated name as supplied when deriving attach handle (ideally without non-portable absolute path)
        const identifierHash = filepathToName(database)
        // decorated name will be assumed relative to main database file when non absolute. Paths supplied as absolute won't be portable
        const absFilepath = isAbsolute(database)
            ? database
            : path.join(this.getMainDatabasePath(), database)

        this.attachedDatabases[database] = {
            attachFilepathAbsolute: absFilepath,
            attachFilepathRelative: database,
            attachHandle: identifierHash,
        }

        return `${identifierHash}.${tableName}`
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        if (this.options.database !== ":memory:") {
            await this.createDatabaseDirectory(this.options.database)
        }

        const {
            database,
            readonly,
            fileMustExist,
            timeout,
            verbose,
            nativeBinding,
        } = this.options
        const connectionOptions = {
            readonly,
            fileMustExist,
            timeout,
            verbose,
            nativeBinding,
        }
        // Remove undefined values
        Object.keys(connectionOptions).forEach((key) => {
            if ((connectionOptions as any)[key] === undefined) {
                delete (connectionOptions as any)[key]
            }
        })

        const databaseConnection = new this.sqlite(database, connectionOptions)

        // in the options, if encryption key for SQLCipher is setted.
        // Must invoke key pragma before trying to do any other interaction with the database.
        if (this.options.key) {
            databaseConnection.pragma(
                `key = ${JSON.stringify(this.options.key)}`,
            )
        }

        if (this.options.enableWAL) {
            databaseConnection.pragma("journal_mode = WAL")
        }

        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        databaseConnection.pragma("foreign_keys = ON")

        return databaseConnection
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            const sqlite =
                this.options.driver || PlatformTools.load("better-sqlite3")
            this.sqlite = sqlite
        } catch (e) {
            throw new DriverPackageNotInstalledError(
                "Better-Sqlite3",
                "better-sqlite3",
            )
        }
    }

    /**
     * Auto creates database directory if it does not exist.
     */
    protected async createDatabaseDirectory(fullPath: string): Promise<void> {
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
    }

    /**
     * Performs the attaching of the database files. The attachedDatabase should have been populated during calls to #buildTableName
     * during EntityMetadata production (see EntityMetadata#buildTablePath)
     *
     * https://sqlite.org/lang_attach.html
     */
    protected async attachDatabases() {
        // @todo - possibly check number of databases (but unqueriable at runtime sadly) - https://www.sqlite.org/limits.html#max_attached
        for (const { attachHandle, attachFilepathAbsolute } of Object.values(
            this.attachedDatabases,
        )) {
            await this.createDatabaseDirectory(attachFilepathAbsolute)
            this.connection.query(
                `ATTACH "${attachFilepathAbsolute}" AS "${attachHandle}"`,
            )
        }
    }

    protected getMainDatabasePath(): string {
        const optionsDb = this.options.database
        return path.dirname(
            isAbsolute(optionsDb)
                ? optionsDb
                : path.join(process.cwd(), optionsDb),
        )
    }
}

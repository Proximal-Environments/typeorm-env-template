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
        this.options = connection.options as BetterSqlite3ConnectionOptions
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
        this.queryRunner = undefined
        this.databaseConnection.close()
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
        await this.createDatabaseDirectory(this.options.database)

        const { database, key, enableWAL, busyTimeout, prepareDatabase } =
            this.options
        const connectionOptions: any = {
            fileMustExist: false,
            verbose: (message: any) =>
                this.connection.logger.log("log", message),
            nativeBinding: this.options.driver,
        }

        if (busyTimeout) {
            connectionOptions.timeout = busyTimeout
        }

        const db = new this.sqlite(database, connectionOptions)

        // in the options, if encryption key for SQLCipher is setted.
        // Must invoke key pragma before trying to do any other interaction with the database.
        if (key) {
            db.pragma(`key = ${JSON.stringify(key)}`)
        }

        if (enableWAL) {
            db.pragma("journal_mode = WAL")
        }

        if (prepareDatabase) {
            prepareDatabase(db)
        }

        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        db.pragma("foreign_keys = ON")

        return db
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
            await this.connection.query(
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

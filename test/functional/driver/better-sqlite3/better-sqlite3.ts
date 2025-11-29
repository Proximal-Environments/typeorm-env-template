import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../src/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}

describe("driver > better-sqlite3", () => {
    let dataSources: DataSource[]
    before(
        async () =>
        (dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to create connection and query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "Hello Better Sqlite3"
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).not.to.be.null
                expect(loadedPost!.title).to.be.equal("Hello Better Sqlite3")
            }),
        ))
})

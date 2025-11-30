import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("better-sqlite3 driver", () => {
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

    it("should be able to store and retrieve data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "Hello Better Sqlite3"
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).to.be.not.undefined
                expect(loadedPost!.title).to.be.equal("Hello Better Sqlite3")
            }),
        ))
})

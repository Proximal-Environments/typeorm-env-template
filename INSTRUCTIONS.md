Implement  support for `better-sqlite3`. follow @DEVELOPMENT_GUIDELINES.md . You have to implement 
- the better-sqlite3 driver.  
    - src/driver/better-sqlite3/BetterSqlite3ConnectionOptions.ts
    - src/driver/better-sqlite3/BetterSqlite3Driver.ts
    - src/driver/better-sqlite3/BetterSqlite3QueryRunner.ts
- Register in DriverFactory and ConnectionOptionsReader
- Also check for special cases where "sqlite" is referenced and add support if needed for "better-sqlite3"

I should be able to register as a datasource
{
    "skip": false,
    "name": "better-sqlite3",
    "type": "better-sqlite3",
    "database": "./temp/better-sqlite3db.db",
    "logging": false
  }
and all tests should pass

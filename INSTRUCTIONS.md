"The Soft Delete functionality in TypeORM is incomplete. While soft deletion itself works, the lifecycle events and hooks specifically for soft removal are missing.

Implement the `BeforeSoftRemove` and `AfterSoftRemove` functionality. This requires a comprehensive implementation across the system:

1.  **Decorators:** Create the `@BeforeSoftRemove` and `@AfterSoftRemove` listeners. **Ensure these are exported from the package root** so users can import them directly.
2.  **Metadata:** Ensure these new listeners are correctly categorized in `EntityMetadata` and processed by the `EntityMetadataBuilder`.
3.  **Broadcaster:** You must implement the broadcasting logic in `Broadcaster.ts`. This involves triggering both the entity listeners (methods on the entity) and any global `EntitySubscriberInterface` subscribers.
4.  **Subscribers:** Update the `EntitySubscriberInterface` to support `beforeSoftRemove` and `afterSoftRemove` methods, and define the `SoftRemoveEvent` interface (**also exported publicly**).
5.  **Execution:** Hook these broadcasts into the `SubjectExecutor` so they fire during the persistence lifecycle of a soft-remove subject.

RESTRICTIONS: You are strictly restricted to modifying files inside the `src/` directory. Do NOT create any new test files, reproduction scripts, or files outside `src`. Do NOT add your own tests."

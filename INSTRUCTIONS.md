"The Soft Delete feature is currently missing its lifecycle hooks. I need you to implement the `@BeforeSoftRemove` and `@AfterSoftRemove` functionality.

The implementation must be comprehensive and fully integrated into the core ORM lifecycle:

1.  **Decorators & Registry:** Define the decorators and ensure they are recognized by the metadata building process and stored with the correct event type.
2.  **Subscriber System:** Update the global subscriber interface to support these new events (`beforeSoftRemove`, `afterSoftRemove`) and define the corresponding event object type (inheriting from the standard remove event where appropriate).
3.  **Broadcasting Logic:** Implement the internal mechanism to trigger these events. This must handle invoking methods on the entity itself (if decorated) *and* notifying any registered global subscribers. It must support async/await patterns properly.
4.  **Execution Hook:** Connect this broadcasting logic into the persistence execution flow so that it strictly fires when a 'soft remove' subject is being processed (just like how standard remove events fire).

RESTRICTIONS: You are strictly restricted to modifying files inside the `src/` directory. Do NOT create any new test files, reproduction scripts, or files outside `src`. Do NOT add your own tests."

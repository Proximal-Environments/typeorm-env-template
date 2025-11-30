"The `@ManyToMany` decorator is currently missing from the codebase. Please implement it.

It should function similarly to the existing relation decorators (like `@ManyToOne`), allowing users to define a many-to-many relationship where a junction table is created.

Requirements:
- It must support overloading: users should be able to pass `(typeFunction, options)` OR `(typeFunction, inverseSide, options)`.
- It must handle parameter normalization to support these overloads.
- It must automatically detect if a relation is 'lazy' (i.e., if the property type is a `Promise`), just like other relations do.
- Ensure it is properly registered in the global metadata arguments storage with the correct `relationType`.
- Ensure it is exported alongside other decorators so it can be imported from the package root.

RESTRICTIONS: You are strictly restricted to modifying files inside the `src/` directory. Do NOT create any new test files, reproduction scripts, or files outside `src`. Do NOT add your own tests."

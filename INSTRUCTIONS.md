"Implement the missing `@ManyToMany` decorator in `src/decorator/relations/ManyToMany.ts` and expose it in `src/index.ts`.

Instead of just a simple wrapper, I need strict adherence to the internal metadata storage pattern:
1.  **Overload Handling:** The decorator must handle three call signatures: `(typeFunction, options)`, `(typeFunction, inverseSide, options)`, and the implementation. You must implement the parameter normalization logic to correctly identify if the second argument is the `inverseSide` or the `options` object.
2.  **Reflection-Based Lazy Loading:** Do not rely solely on `options.lazy`. You must use `Reflect.getMetadata("design:type", ...)` to check if the property type is a `Promise`. If it is, force `isLazy` to true.
3.  **Storage Registration:** It must push a `RelationMetadataArgs` object to `getMetadataArgsStorage().relations`. The object structure must strictly match: `{ target, propertyName, relationType: "many-to-many", isLazy, type, inverseSideProperty, options }`.

RESTRICTIONS: Modify only `src/`. Do NOT create tests. Use existing project utilities for object checking if available."

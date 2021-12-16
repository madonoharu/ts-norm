import {
  AnyEntitySchema,
  AnySchema,
  AnySchemaArray,
  AnySchemaObject,
  EntityId,
  NestedEntities,
  NormalizedSchema,
  isObject,
  nonNullable,
  isEntitySchema,
} from "./types";

export class Normalizer {
  entities: NestedEntities = {};
  cache = new Map<unknown, EntityId>();

  addEntity(schema: AnyEntitySchema, id: EntityId, processedEntity: object) {
    const obj = (this.entities[schema.key] ||= {});
    obj[id] = processedEntity;
  }

  visitArray(input: object, schema: AnySchemaArray) {
    const localSchema = schema[0];
    return Object.values(input).map((value) => this.visit(value, localSchema));
  }

  visitObject(input: Record<string, unknown>, schema: AnySchemaObject) {
    const result = { ...input };

    const keys = Object.keys(schema) as (keyof typeof schema)[];

    keys.forEach((key) => {
      const localSchema = schema[key];

      if (nonNullable(localSchema)) {
        const value = this.visit(input[key], localSchema);

        if (value === undefined) {
          delete result[key];
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }

  visitEntity(input: object, schema: AnyEntitySchema): EntityId {
    const cachedId = this.cache.get(input);
    if (cachedId !== undefined) {
      return cachedId;
    }

    return schema.normalize(input, this) as EntityId;
  }

  visit(input: unknown, schema: AnySchema): unknown {
    if (!isObject(input)) {
      return input;
    }

    if (isEntitySchema(schema)) {
      return this.visitEntity(input, schema);
    }

    if (Array.isArray(schema)) {
      return this.visitArray(input, schema);
    }

    return this.visitObject(input as Record<string, unknown>, schema);
  }
}

export function normalize<I extends object, S extends AnySchema>(
  input: I,
  schema: S
): NormalizedSchema<I, S> {
  if (!input || typeof input !== "object") {
    throw new Error(
      `Unexpected input given to normalize. Expected type to be "object", found "${
        input === null ? "null" : typeof input
      }".`
    );
  }

  const visitor = new Normalizer();
  const result = visitor.visit(input, schema);

  return {
    entities: visitor.entities,
    result,
  } as NormalizedSchema<I, S>;
}

import {
  AnyEntitySchema,
  AnySchema,
  AnySchemaArray,
  AnySchemaObject,
  EntityId,
  Entities,
  NoInfer,
  NormalizedSchemaEntities,
  NormalizedSchemaResult,
  Schema,
  isObject,
  nonNullable,
  isEntitySchema,
  isEntityId,
} from "./types";

export class Denormalizer {
  cache: Record<string, object> = {};

  constructor(public entities: Entities) {}

  getEntity(input: EntityId, schema: AnyEntitySchema) {
    return this.entities[schema.key]?.[input];
  }

  visitArray(input: object, schema: AnySchemaArray) {
    const localSchema = schema[0];

    if (Array.isArray(input)) {
      return input.map((value) => this.visit(value, localSchema));
    }

    return input;
  }

  visitObject(input: object, schema: AnySchemaObject) {
    const result: Record<string, unknown> = { ...input };

    const keys = Object.keys(schema);

    keys.forEach((key) => {
      const localSchema = schema[key];
      if (result[key] != null && nonNullable(localSchema)) {
        result[key] = this.visit(result[key], localSchema);
      }
    });

    return result;
  }

  visitEntity(id: EntityId, schema: AnyEntitySchema) {
    const { cache } = this;
    let entity = this.getEntity(id, schema);

    if (entity === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      entity = schema.fallback(id);
    }

    if (!isObject(entity)) {
      return entity;
    }

    const key = `${schema.key}-${id}`;

    if (!cache[key]) {
      const entityCopy = { ...entity };

      // Need to set this first so that if it is referenced further within the
      // denormalization the reference will already exist.
      cache[key] = entityCopy;
      cache[key] = schema.denormalize(entityCopy, this);
    }

    return cache[key];
  }

  visit(input: unknown, schema: AnySchema): unknown {
    if (isEntitySchema(schema)) {
      if (!isEntityId(input)) {
        return input;
      }

      return this.visitEntity(input, schema);
    }

    if (!isObject(input)) {
      return input;
    }

    return Array.isArray(schema)
      ? this.visitArray(input, schema)
      : this.visitObject(input, schema);
  }
}

type SchemaInputType<S extends AnySchema> = S extends Schema<infer T>
  ? T
  : never;

export function denormalize<S extends AnySchema>(
  input: NormalizedSchemaResult<SchemaInputType<S>, S>,
  schema: S,
  entities: NoInfer<NormalizedSchemaEntities<S>>
): SchemaInputType<S> {
  const visitor = new Denormalizer(entities as Entities);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return visitor.visit(input, schema) as SchemaInputType<S>;
}

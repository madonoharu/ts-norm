import { EntityOptions, EntitySchema } from "./entity";
import { EntityId, EntitySchemaDefinition } from "./types";

type ExtractIdType<
  Input extends object,
  IdAttribute extends string
> = IdAttribute extends keyof Input
  ? Extract<Input[IdAttribute], EntityId>
  : EntityId;

interface SchemaBuilder<Input extends object> {
  entity<Key extends string>(
    key: Key
    /* eslint-disable @typescript-eslint/ban-types */
  ): EntitySchema<Input, Key, {}, "id", ExtractIdType<Input, "id">>;
  entity<Key extends string, Definition extends EntitySchemaDefinition<Input>>(
    key: Key,
    definition: Definition
  ): EntitySchema<Input, Key, Definition, "id", ExtractIdType<Input, "id">>;
  entity<
    Key extends string,
    Definition extends EntitySchemaDefinition<Input>,
    IdAttribute extends string = "id",
    IdType extends EntityId = ExtractIdType<Input, IdAttribute>
  >(
    key: Key,
    definition: Definition,
    options: EntityOptions<Input, Key, Definition, IdAttribute, IdType>
  ): EntitySchema<Input, Key, Definition, IdAttribute, IdType>;
}

const entity = (
  key: string,
  definition: EntitySchemaDefinition<object> = {},
  options = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): EntitySchema<any, string, any, any, any> => {
  return new EntitySchema(key, definition, options);
};

const builder = {
  entity,
};

export function schema<T extends object>(): SchemaBuilder<T> {
  return builder;
}

export * from "./types";
export { normalize } from "./normalize";
export { denormalize } from "./denormalize";
export { EntitySchema } from "./entity";

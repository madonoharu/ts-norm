/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntitySchema } from "./entity";

export interface Dictionary<T> {
  [id: string]: T | undefined;
}

export type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0
  ? I
  : never;

export type CircularMark = { __mark: "circular" };

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type EntityId = string | number;

export type SchemaFunction<T = unknown> = (
  value: T,
  parent: unknown,
  key: string
) => string;

type ObjectTypeKeys<T> = {
  [P in keyof T]: T[P] extends object ? P : never;
}[keyof T];

export type EntitySchemaDefinition<T> = {
  [P in keyof T & string]?: Schema<T[P] & object>;
};

export type SchemaObject<T extends object> = ObjectTypeKeys<T> extends never
  ? never
  : {
      [P in keyof T]: T[P] extends object ? Schema<T[P]> : never;
    };

export type SchemaArray<T> = Schema<T & object>[];

export type Schema<T extends object> = T extends (infer I)[]
  ? SchemaArray<I>
  : EntitySchema<T, any, any, any, any> | SchemaObject<T>;

export type AnyEntitySchema = EntitySchema<any, string, any, any, any>;
export type AnySchemaArray = AnySchema[];
export type AnySchemaObject = { [key: string]: AnySchema | undefined };
export type AnySchema = AnyEntitySchema | AnySchemaArray | AnySchemaObject;

export type Entities = Record<string, Dictionary<object>>;

export type EntityIdType<E extends AnyEntitySchema> = E extends EntitySchema<
  any,
  any,
  any,
  any,
  infer IdType
>
  ? IdType
  : never;

type EntityTypeImpl<
  Input extends object,
  Definition extends EntitySchemaDefinition<Input>,
  IdAttribute extends string,
  IdType extends EntityId
> = NormalizedSchemaResult<Input, Definition> & Record<IdAttribute, IdType>;

export type EntityType<E extends AnyEntitySchema> = E extends EntitySchema<
  infer Input,
  any,
  infer Definition,
  infer IdAttribute,
  infer IdType
>
  ? EntityTypeImpl<Input, Definition, IdAttribute, IdType>
  : never;

export type NormalizedSchemaResultArray<
  I,
  S extends AnySchemaArray
> = I extends (infer Item)[] ? NormalizedSchemaResult<Item, S[0]>[] : never;

export type NormalizedSchemaResultObject<I, S extends AnySchemaObject> = {
  [K in keyof I]: K extends keyof S
    ? NormalizedSchemaResult<I[K], Extract<S[K], AnySchema>>
    : I[K];
};

export type NormalizedSchemaResult<I, S extends AnySchema> = I extends object
  ? S extends AnyEntitySchema
    ? EntityIdType<S>
    : S extends AnySchemaArray
    ? NormalizedSchemaResultArray<I, S>
    : S extends AnySchemaObject
    ? NormalizedSchemaResultObject<I, S>
    : never
  : I;

type NormalizedSchemaEntitiesUnionImpl<
  Input extends object,
  Key extends string,
  Definition extends EntitySchemaDefinition<Input>,
  IdAttribute extends string,
  IdType extends EntityId
> =
  | Record<
      Key,
      Dictionary<EntityTypeImpl<Input, Definition, IdAttribute, IdType>>
    >
  | NormalizedSchemaEntitiesUnion<Definition>;

type NormalizedSchemaEntitiesUnion<S extends AnySchema> =
  S extends EntitySchema<
    infer Input,
    infer Key,
    infer Definition,
    infer IdAttribute,
    infer IdType
  >
    ? S extends CircularMark
      ? never
      : NormalizedSchemaEntitiesUnionImpl<
          Input,
          Key,
          Definition,
          IdAttribute,
          IdType
        >
    : S extends AnySchemaArray
    ? NormalizedSchemaEntitiesUnion<S[0]>
    : S extends Record<string, AnySchema>
    ? {
        [P in keyof S]: NormalizedSchemaEntitiesUnion<S[P]>;
      }[keyof S]
    : never;

export type NormalizedSchemaEntities<S extends AnySchema> = AnySchema extends S
  ? never
  : UnionToIntersection<NormalizedSchemaEntitiesUnion<S>>;

export type NormalizedSchema<I, S extends AnySchema> = {
  result: NormalizedSchemaResult<I, S>;
  entities: NormalizedSchemaEntities<S>;
};

export function isObject(v: unknown): v is object {
  return typeof v === "object" && Boolean(v);
}

export function isEntitySchema(v: unknown): v is AnyEntitySchema {
  return v instanceof EntitySchema;
}

export function nonNullable<T>(item: T): item is NonNullable<T> {
  return item !== undefined && item !== null;
}

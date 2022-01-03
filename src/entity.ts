import { Denormalizer } from "./denormalize";
import { Normalizer } from "./normalize";
import {
  nonNullable,
  isEntityId,
  CircularMark,
  EntityId,
  EntitySchemaDefinition,
} from "./types";

export type DefinitionEntries<S extends EntitySchemaDefinition<object>> = [
  keyof S & string,
  NonNullable<S[keyof S & string]>
][];

export type FallbackFn<
  Input extends object,
  Key extends string,
  Definition extends EntitySchemaDefinition<Input>,
  IdAttribute extends string,
  IdType extends EntityId
> = (
  id: IdType,
  schema: EntitySchema<Input, Key, Definition, IdAttribute, IdType>
) => Input;

export interface EntityOptions<
  Input extends object,
  Key extends string,
  Definition extends EntitySchemaDefinition<Input>,
  IdAttribute extends string,
  IdType extends EntityId
> {
  idAttribute?: IdAttribute;
  generateId?: () => IdType;
  fallbackStrategy?: FallbackFn<Input, Key, Definition, IdAttribute, IdType>;
}

export class EntitySchema<
  Input extends object,
  Key extends string,
  Definition extends EntitySchemaDefinition<Input>,
  IdAttribute extends string,
  IdType extends EntityId
> {
  idAttribute: IdAttribute;
  generateId?: EntityOptions<
    Input,
    Key,
    Definition,
    IdAttribute,
    IdType
  >["generateId"];
  fallbackStrategy?: EntityOptions<
    Input,
    Key,
    Definition,
    IdAttribute,
    IdType
  >["fallbackStrategy"];

  constructor(
    public key: Key,
    public definition: Definition,
    options: EntityOptions<Input, Key, Definition, IdAttribute, IdType> = {}
  ) {
    this.idAttribute = (options.idAttribute || "id") as IdAttribute;
    if (options.generateId) {
      this.generateId = options.generateId;
    }
    if (options.fallbackStrategy) {
      this.fallbackStrategy = options.fallbackStrategy;
    }
  }

  define<D2 extends EntitySchemaDefinition<Input>>(
    definition: D2 & EntitySchemaDefinition<Input>
  ): EntitySchema<Input, Key, Definition & D2, IdAttribute, IdType>;

  define<D2 extends EntitySchemaDefinition<Input>>(
    definition: (
      self: this & CircularMark
    ) => D2 & EntitySchemaDefinition<Input>
  ): EntitySchema<Input, Key, Definition & D2, IdAttribute, IdType>;

  define<D2 extends EntitySchemaDefinition<Input>>(
    definition: D2 | ((self: this & CircularMark) => D2)
  ): EntitySchema<Input, Key, Definition & D2, IdAttribute, IdType> {
    if (typeof definition === "function") {
      Object.assign(this.definition, definition(this as this & CircularMark));
    } else {
      Object.assign(this.definition, definition);
    }

    return this as unknown as EntitySchema<
      Input,
      Key,
      Definition & D2,
      IdAttribute,
      IdType
    >;
  }

  getId(input: Input): EntityId | undefined {
    const id = (input as Record<string, unknown>)[this.idAttribute];

    if (isEntityId(id)) {
      return id;
    }

    return this.generateId?.();
  }

  fallback(id: EntityId) {
    return this.fallbackStrategy?.(id as IdType, this);
  }

  definitionEntries(): DefinitionEntries<Definition> {
    return Object.entries(this.definition).filter((entry) =>
      nonNullable(entry[1])
    ) as DefinitionEntries<Definition>;
  }

  normalize(input: Input, visitor: Normalizer): IdType | undefined {
    const id = this.getId(input);

    if (id === undefined) {
      return;
    }

    visitor.cache.set(input, id);

    const processedEntity: Record<string, unknown> = {
      [this.idAttribute]: id,
      ...input,
    };

    this.definitionEntries().forEach(([key, schema]) => {
      if (
        Object.prototype.hasOwnProperty.call(processedEntity, key) &&
        typeof processedEntity[key] === "object"
      ) {
        processedEntity[key] = visitor.visit(processedEntity[key], schema);
      }
    });

    visitor.addEntity(this, id, processedEntity);

    return id as IdType | undefined;
  }

  denormalize(entity: Record<string, unknown>, visitor: Denormalizer) {
    this.definitionEntries().forEach(([key, schema]) => {
      if (Object.prototype.hasOwnProperty.call(entity, key)) {
        entity[key] = visitor.visit(entity[key], schema);
      }
    });

    return entity;
  }
}

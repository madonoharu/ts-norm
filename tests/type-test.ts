/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import {
  NormalizedSchema,
  EntitySchema,
  Dictionary,
  AnySchema,
  IsAny,
  schema,
  EntityId,
  EntityType,
} from "../src";

type Equals<T, U> = IsAny<
  T,
  never,
  IsAny<U, never, [T] extends [U] ? ([U] extends [T] ? unknown : never) : never>
>;

export function expectExactType<T>() {
  return <U extends Equals<T, U>>(u: U) => expect(u);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function testType<T, U extends Equals<T, U>>() {}

{
  type User = {
    id: string;
    name: string;
  };

  type Article = {
    id: string;
    title: string;
    author?: User;
  };

  type UserSchema = EntitySchema<User, "users", {}, "id", string>;
  type ArticleSchema = EntitySchema<
    Article,
    "articles",
    { author: UserSchema },
    "id",
    string
  >;

  type Expected = {
    result: string;
    entities: {
      users: Dictionary<User>;
      articles: Dictionary<{
        id: string;
        title: string;
        author?: string;
      }>;
    };
  };

  testType<NormalizedSchema<{}, ArticleSchema>, Expected>();
}

{
  type Expected = {
    result: any;
    entities: unknown;
  };

  testType<NormalizedSchema<any, AnySchema>, Expected>();
}

{
  type Leaf = {
    type: "leaf";
  };

  type Node = {
    type: "node";
    children: (Node | Leaf)[];
  };

  type Input = Node | Leaf;

  const node = schema<Input>()
    .entity("nodes")
    .define((self) => ({
      children: [self],
    }));

  type Entity =
    | { id: EntityId; type: "leaf" }
    | { id: EntityId; type: "node"; children: EntityId[] };

  type Expected = {
    result: EntityId;
    entities: {
      nodes: Dictionary<Entity>;
    };
  };

  testType<EntityType<typeof node>, Entity>();
  testType<NormalizedSchema<Node | Leaf, typeof node>, Expected>();
}

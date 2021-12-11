/* eslint-disable @typescript-eslint/ban-types */
import { NormalizedSchema, EntitySchema, Dictionary } from "../src";

export type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False;

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

/* eslint-disable @typescript-eslint/ban-types */
import { NormalizedSchema, EntitySchema, Dictionary } from "../src";
import { testType } from "./utils";

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

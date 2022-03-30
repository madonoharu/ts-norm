import { denormalize, normalize, schema, Dictionary } from "../src";
import { expectExactType } from "./type-test";

describe("entity", () => {
  test("with idAttribute", () => {
    interface User {
      userId: number;
      name: string;
    }
    interface Article {
      articleId: number;
      title: string;
      author?: User;
    }

    const user = schema<User>().entity(
      "users",
      {},
      {
        idAttribute: "userId",
      }
    );
    const article = schema<Article>().entity(
      "articles",
      { author: user },
      { idAttribute: "articleId" }
    );

    const input: Article = {
      articleId: 1,
      title: "foo",
      author: {
        userId: 2,
        name: "bar",
      },
    };

    type Expected = {
      result: number;
      entities: {
        users: Dictionary<User>;
        articles: Dictionary<{
          articleId: number;
          title: string;
          author?: number;
        }>;
      };
    };

    const normalized = normalize(input, article);
    const denormalized: Article = denormalize(
      normalized.result,
      article,
      normalized.entities
    );

    expectExactType<Expected>()(normalized).toEqual({
      result: 1,
      entities: {
        articles: { "1": { articleId: 1, title: "foo", author: 2 } },
        users: { "2": { userId: 2, name: "bar" } },
      },
    });
    expectExactType<Article>()(denormalized).toEqual(input);
  });

  test("with generateId", () => {
    interface User {
      name: string;
    }
    interface Article {
      title: string;
      author: User;
    }

    const genUserId = jest.fn<string, []>().mockReturnValueOnce("user1");
    const genArticleId = jest.fn<number, []>().mockReturnValueOnce(2);

    const user = schema<User>().entity(
      "users",
      {},
      {
        idAttribute: "userId",
        idGenerator: genUserId,
      }
    );
    const article = schema<Article>().entity(
      "articles",
      { author: user },
      {
        idAttribute: "articleId",
        idGenerator: genArticleId,
      }
    );

    type Expected = {
      result: number;
      entities: {
        users: Dictionary<{
          userId: string;
          name: string;
        }>;
        articles: Dictionary<{
          articleId: number;
          title: string;
          author: string;
        }>;
      };
    };

    const input: Article = {
      title: "foo",
      author: {
        name: "bar",
      },
    };

    const normalized = normalize(input, article);

    const denormalized: Article = denormalize(
      normalized.result,
      article,
      normalized.entities
    );

    expectExactType<Expected>()(normalized).toEqual({
      result: 2,
      entities: {
        articles: { "2": { articleId: 2, title: "foo", author: "user1" } },
        users: { user1: { userId: "user1", name: "bar" } },
      },
    });

    expectExactType<Article>()(denormalized).toEqual({
      articleId: 2,
      title: "foo",
      author: {
        userId: "user1",
        name: "bar",
      },
    });
  });
});

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { denormalize, schema } from "../src";
import { expectExactType } from "./utils";

describe("denormalize", () => {
  test("cannot denormalize without a schema", () => {
    expect(() =>
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      denormalize({}, undefined, {})
    ).toThrow();
  });

  test("denormalizes entities", () => {
    type Taco = { id: number; type: string };

    const mySchema = schema<Taco>().entity("tacos");

    const entities = {
      tacos: {
        1: { id: 1, type: "foo" },
        2: { id: 2, type: "bar" },
      },
    };

    const result = denormalize([1, 2], [mySchema], entities);

    type Expected = Taco[];
    expectExactType<Expected>()(result).toMatchSnapshot();
  });

  test("denormalizes nested entities", () => {
    type User = {
      id: string;
      name: string;
    };

    type Comment = {
      id: string;
      comment: string;
      user: User;
    };

    type Article = {
      id: string;
      author: User;
      body: string;
      comments: Comment[];
      title: string;
    };

    const user = schema<User>().entity("users");
    const comment = schema<Comment>().entity("comments", {
      user,
    });
    const article = schema<Article>().entity("articles", {
      author: user,
      comments: [comment],
    });

    const entities = {
      articles: {
        123: {
          author: "8472",
          body: "This article is great.",
          comments: ["comment-123-4738"],
          id: "123",
          title: "A Great Article",
        },
      },
      comments: {
        "comment-123-4738": {
          comment: "I like it!",
          id: "comment-123-4738",
          user: "10293",
        },
      },
      users: {
        10293: {
          id: "10293",
          name: "Jane",
        },
        8472: {
          id: "8472",
          name: "Paul",
        },
      },
    };

    type Expected = Article;

    expectExactType<Expected>()(
      denormalize("123", article, entities)
    ).toMatchSnapshot();
  });

  test("set to undefined if schema key is not in entities", () => {
    type Comment = {
      id: string;
      user: object;
    };

    type Article = {
      id: string;
      author: object;
      comments: Comment[];
    };

    const user = schema().entity("users");
    const comment = schema<Comment>().entity("comments", {
      user,
    });
    const article = schema<Article>().entity("articles", {
      author: user,
      comments: [comment],
    });

    const entities = {
      users: {},
      articles: {
        123: {
          id: "123",
          author: "8472",
          comments: ["1"],
        },
      },
      comments: {
        1: {
          id: "1",
          user: "123",
        },
      },
    };

    type Expected = Article;

    expectExactType<Expected>()(
      denormalize("123", article, entities)
    ).toMatchSnapshot();
  });

  test("does not modify the original entities", () => {
    type User = {
      id: string;
      name: string;
    };
    type Article = {
      id: string;
      title: string;
      author: User;
    };

    const user = schema<User>().entity("users");
    const article = schema<Article>().entity("articles", { author: user });

    const entities = Object.freeze({
      articles: Object.freeze({
        123: Object.freeze({
          id: "123",
          title: "A Great Article",
          author: "8472",
        }),
      }),
      users: Object.freeze({
        8472: Object.freeze({
          id: "8472",
          name: "Paul",
        }),
      }),
    });

    expect(() => denormalize("123", article, entities)).not.toThrow();
  });
});

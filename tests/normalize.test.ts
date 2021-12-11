/* eslint-disable @typescript-eslint/ban-ts-comment */
import { normalize, schema, Dictionary, EntityId } from "../src";
import { expectExactType } from "./utils";

describe("normalize", () => {
  [42, null, undefined, "42", () => undefined].forEach((input) => {
    test(`cannot normalize input that == ${String(input)}`, () => {
      // @ts-expect-error
      expect(() => normalize(input, schema().entity("test"))).toThrow();
    });
  });

  test("normalizes entities", () => {
    interface Taco {
      id: number;
      type: string;
    }

    const mySchema = schema<Taco>().entity("tacos");

    type Expected = {
      result: number[];
      entities: {
        tacos: Dictionary<Taco>;
      };
    };

    expectExactType<Expected>()(
      normalize(
        [
          { id: 1, type: "foo" },
          { id: 2, type: "bar" },
        ],
        [mySchema]
      )
    ).toMatchSnapshot();
  });

  test("normalizes entities with circular references", () => {
    type User = {
      id: number;
      friends: User[];
    };

    const user = schema<User>()
      .entity("users")
      .define((self) => ({
        friends: [self],
      }));

    const input: User = { id: 123, friends: [] };
    input.friends.push(input);

    type Expected = {
      result: number;
      entities: {
        users: Dictionary<{
          id: number;
          friends: number[];
        }>;
      };
    };

    expectExactType<Expected>()(normalize(input, user)).toMatchSnapshot();
  });

  test("normalizes nested entities", () => {
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
      title: string;
      author: User;
      body: string;
      comments: Comment[];
    };

    const user = schema<User>().entity("users");

    const comment = schema<Comment>().entity("comments").define({
      user,
    });

    const article = schema<Article>().entity("articles", {
      author: user,
      comments: [comment],
    });

    const input: Article = {
      id: "123",
      title: "A Great Article",
      author: {
        id: "8472",
        name: "Paul",
      },
      body: "This article is great.",
      comments: [
        {
          id: "comment-123-4738",
          comment: "I like it!",
          user: {
            id: "10293",
            name: "Jane",
          },
        },
      ],
    };

    type Expected = {
      result: string;
      entities: {
        users: Dictionary<User>;
        comments: Dictionary<{
          id: string;
          comment: string;
          user: string;
        }>;
        articles: Dictionary<{
          id: string;
          title: string;
          author: string;
          body: string;
          comments: string[];
        }>;
      };
    };

    expectExactType<Expected>()(normalize(input, article)).toMatchSnapshot();
  });

  test("does not modify the original input", () => {
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
    const article = schema<Article>().entity("articles").define({
      author: user,
    });
    const input: Article = Object.freeze({
      id: "123",
      title: "A Great Article",
      author: Object.freeze({
        id: "8472",
        name: "Paul",
      }),
    });

    type Expected = {
      result: string;
      entities: {
        users: Dictionary<User>;
        articles: Dictionary<{
          id: string;
          title: string;
          author: string;
        }>;
      };
    };

    expect((): Expected => normalize(input, article)).not.toThrow();
  });

  test("ignores null values", () => {
    const myEntity = schema().entity("myentities");

    type Expected<T> = {
      result: T[];
      entities: {
        myentities: Dictionary<{ id: EntityId }>;
      };
    };

    expectExactType<Expected<null>>()(
      normalize([null], [myEntity])
    ).toMatchSnapshot();
    expectExactType<Expected<undefined>>()(
      normalize([undefined], [myEntity])
    ).toMatchSnapshot();
    expectExactType<Expected<false>>()(
      normalize([false as const], [myEntity])
    ).toMatchSnapshot();
  });

  test("can normalize object without proper object prototype inheritance", () => {
    type Element = {
      id: number;
      name: string;
    };
    type Test = {
      id: number;
      elements: Element[];
    };

    const testEntity = schema<Test>().entity("test", {
      elements: [schema<Element>().entity("elements")],
    });

    const input: Test = {
      id: 1,
      elements: [],
    };

    input.elements.push(
      Object.assign<unknown, Element>(Object.create(null), {
        id: 18,
        name: "test",
      })
    );

    type Expected = {
      result: number;
      entities: {
        elements: Dictionary<Element>;
        test: Dictionary<{ id: number; elements: number[] }>;
      };
    };

    expect((): Expected => normalize(input, testEntity)).not.toThrow();
  });
});

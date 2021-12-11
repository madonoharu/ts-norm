# ts-norm

[![npm version](https://img.shields.io/npm/v/ts-norm?style=flat-square)](https://www.npmjs.com/package/ts-norm)

A [normalizr](https://github.com/paularmstrong/normalizr) like library for TypeScript.  
🙏Pull requests are welcome!

## Installation

```shell
yarn add ts-norm
```

```shell
npm install ts-norm
```

## Quick Start

Consider a typical blog post. The API response for a single post might look something like this:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    }
  ]
}
```

We have two nested entity types within our `article`: `users` and `comments`. Using various `schema`, we can normalize all three entity types down:

```ts
import { normalize, denormalize, schema, Dictionary } from "ts-norm";

type User = {
  id: string;
  name: string;
};
type Comment = {
  id: string;
  commenter: User;
};
type Article = {
  id: string;
  author: User;
  title: string;
  comments: Comment[];
};

// Define a users schema
const user = schema<User>().entity("users");

// Define your comments schema
const comment = schema<Comment>().entity("comments", {
  commenter: user,
});

// Define your article
const article = schema<Article>().entity("articles", {
  author: user,
  comments: [comment],
});

const normalizedData = normalize(originalData, article);
const denormalizedData = denormalize(
  normalizedData.result,
  article,
  normalizedData.entities
);

type Expected = {
  result: string;
  entities: {
    users: Dictionary<{ id: string; name: string }>;
    comments: Dictionary<{ id: string; commenter: string }>;
    articles: Dictionary<{
      id: string;
      author: string;
      title: string;
      comments: string[];
    }>;
  };
};

// Type Safe!!
function expectType<T>(_: T) {}
expectType<Expected>(normalizedData);
expectType<Article>(denormalizedData);
```

Now, `normalizedData` will be:

```json
{
  "result": "123",
  "entities": {
    "articles": {
      "123": {
        "id": "123",
        "author": "1",
        "title": "My awesome blog post",
        "comments": ["324"]
      }
    },
    "users": {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    "comments": {
      "324": { "id": "324", "commenter": "2" }
    }
  }
}
```

## With `idAttribute` & `generateId`

```ts
type User = {
  name: string;
};
type Article = {
  title: string;
  author: User;
};

const user = schema<User>().entity(
  "users",
  {},
  {
    idAttribute: "userId",
    generateId: (): string => uuid(),
  }
);
const article = schema<Article>().entity(
  "articles",
  { author: user },
  {
    idAttribute: "articleId",
    generateId: (): number => counter(),
  }
);

const normalizedData = normalize(originalData, article);

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

function expectType(_: Expected) {}
expectType(normalizedData);
```

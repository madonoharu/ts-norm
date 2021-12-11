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

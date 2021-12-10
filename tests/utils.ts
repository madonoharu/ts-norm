type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? X
  : never;

export function expectExactType<T>() {
  return <U extends Equal<T, U>>(u: U) => expect(u);
}

import type { ResultAsync } from "./result-async";

export type InferAsyncOkTypes<R> = R extends ResultAsync<infer O, unknown> ? O : never;

export type InferAsyncErrTypes<R> = R extends ResultAsync<unknown, infer E> ? E : never;

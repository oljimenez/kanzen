import type { Result } from "./result-sync";

export type InferOkTypes<R> = R extends Result<infer O, unknown> ? O : never;

export type InferErrTypes<R> = R extends Result<unknown, infer E> ? E : never;

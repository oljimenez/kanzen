export * as r from "./result";
export * from "./result";

export type { ResultAsync } from "./async/result-async";
export type { Result, ResultOk, ResultErr, ResultSync } from "./sync/result-sync";
export type { InferAsyncErrTypes, InferAsyncOkTypes } from "./async/types";
export type { InferErrTypes, InferOkTypes } from "./sync/types";

export * from "./errors";
export * from "./enums";

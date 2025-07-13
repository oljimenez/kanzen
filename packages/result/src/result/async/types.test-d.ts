import { expectTypeOf, test } from "vitest";
import type { ResultAsync } from "./result-async";
import type { InferAsyncErrTypes, InferAsyncOkTypes } from "./types";

//############################################################
//##################### InferAsyncOkTypes ####################
//############################################################

test("InferAsyncOkTypes should infer the Ok primitive values", () => {
    type ResultOk = number;
    type ResultExample = InferAsyncOkTypes<ResultAsync<number, never>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
});

test("InferAsyncOkTypes should infer Ok object values", () => {
    type ResultOk = { name: number };
    type ResultExample = InferAsyncOkTypes<ResultAsync<ResultOk, never>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
});

test("InferAsyncOkTypes should fail if wrong value is entered", () => {
    type ResultOk = { name: number }[];
    type ResultExample = InferAsyncOkTypes<ResultAsync<ResultOk, never>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
});

//############################################################
//##################### InferAsyncErrTypes ###################
//############################################################

test("InferAsyncErrTypes should infer the Err primitive values", () => {
    type ResultErr = number;
    type ResultExample = InferAsyncErrTypes<ResultAsync<never, ResultErr>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
});

test("InferAsyncErrTypes should infer Err object values", () => {
    type ResultErr = { name: number };
    type ResultExample = InferAsyncErrTypes<ResultAsync<never, ResultErr>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
});

test("InferAsyncErrTypes should fail if wrong value is entered", () => {
    type ResultErr = { name: number }[];
    type ResultExample = InferAsyncErrTypes<ResultAsync<never, ResultErr>>;

    expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
});

import { describe, expectTypeOf, test } from "vitest";
import { type Result, type ResultEmpty, errSync, okSync } from "./result-sync";
import type { InferErrTypes, InferOkTypes } from "./types";

//############################################################
//##################### InferOkTypes #########################
//############################################################

describe("InferOkTypes", () => {
    test("should infer the Ok primitive values", () => {
        type ResultOk = number;
        type ResultExample = InferOkTypes<Result<ResultOk, never>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
    });

    test("should infer Ok object values", () => {
        type ResultOk = { name: number };
        type ResultExample = InferOkTypes<Result<ResultOk, never>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
    });

    test("should infer Ok array values", () => {
        type ResultOk = { name: number }[];
        type ResultExample = InferOkTypes<Result<ResultOk, never>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultOk>();
    });
});

//##############################################################
//##################### InferErrTypes ##########################
//##############################################################

describe("InferErrTypes", () => {
    test("should infer the Err primitive values", () => {
        type ResultErr = number;
        type ResultExample = InferErrTypes<Result<never, ResultErr>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
    });

    test("should infer Err object values", () => {
        type ResultErr = { name: number };
        type ResultExample = InferErrTypes<Result<never, ResultErr>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
    });

    test("should fail if wrong value is entered", () => {
        type ResultErr = { name: number }[];
        type ResultExample = InferErrTypes<Result<never, ResultErr>>;

        expectTypeOf<ResultExample>().toEqualTypeOf<ResultErr>();
    });
});

//###############################################################
//##################### Result.isOk() ###########################
//###############################################################

describe("Result.isOk()", () => {
    test("should correctly split the discrimination union of result ok", () => {
        const okResult = okSync<number>(42);

        // Type testing
        if (okResult.isOk()) {
            expectTypeOf<typeof okResult.ok>().toEqualTypeOf<number>();
            expectTypeOf<typeof okResult.err>().toEqualTypeOf<ResultEmpty>();
        } else {
            expectTypeOf<typeof okResult.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof okResult.err>().toEqualTypeOf<never>();
        }
    });

    test("should correctly split the discrimination union of result err", () => {
        const errResult = errSync<string>("failed");

        if (errResult.isOk()) {
            expectTypeOf<typeof errResult.ok>().toEqualTypeOf<never>();
            expectTypeOf<typeof errResult.err>().toEqualTypeOf<ResultEmpty>();
        } else {
            expectTypeOf<typeof errResult.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof errResult.err>().toEqualTypeOf<string>();
        }
    });

    test("should properly narrow types in both branches", () => {
        const result: Result<boolean, Error> =
            Math.random() > 0.5 ? okSync(true) : errSync(new Error("failed"));

        if (result.isOk()) {
            // In the ok branch
            expectTypeOf<typeof result.ok>().toEqualTypeOf<boolean>();
            expectTypeOf<typeof result.err>().toEqualTypeOf<ResultEmpty>();
        } else {
            // In the error branch
            expectTypeOf<typeof result.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof result.err>().toEqualTypeOf<Error>();
        }
    });
});

//################################################################
//##################### Result.isErr() ###########################
//################################################################

describe("Result.isOk()", () => {
    test("should correctly split the discrimination union of result ok", () => {
        const okResult = okSync<number>(42);

        if (okResult.isErr()) {
            expectTypeOf<typeof okResult.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof okResult.err>().toEqualTypeOf<never>();
        } else {
            expectTypeOf<typeof okResult.ok>().toEqualTypeOf<number>();
            expectTypeOf<typeof okResult.err>().toEqualTypeOf<ResultEmpty>();
        }
    });

    test("should correctly split the discrimination union of result err", () => {
        const errResult = errSync<string>("failed");

        if (errResult.isErr()) {
            expectTypeOf<typeof errResult.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof errResult.err>().toEqualTypeOf<string>();
        } else {
            expectTypeOf<typeof errResult.ok>().toEqualTypeOf<never>();
            expectTypeOf<typeof errResult.err>().toEqualTypeOf<ResultEmpty>();
        }
    });

    test("should properly narrow types in both branches", () => {
        const result: Result<boolean, Error> =
            Math.random() > 0.5 ? okSync(true) : errSync(new Error("failed"));

        if (result.isErr()) {
            expectTypeOf<typeof result.ok>().toEqualTypeOf<ResultEmpty>();
            expectTypeOf<typeof result.err>().toEqualTypeOf<Error>();
        } else {
            expectTypeOf<typeof result.ok>().toEqualTypeOf<boolean>();
            expectTypeOf<typeof result.err>().toEqualTypeOf<ResultEmpty>();
        }
    });
});

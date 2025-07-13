import { ResultStatus, type ResultStatusUnion } from "../enums";
import { ImposibleError, NoThrowAllowedError } from "../errors";
import type { InferErrTypes, InferOkTypes } from "./types";

export const ResultEmpty = Symbol("ResultEmpty");

export type ResultEmpty = typeof ResultEmpty;

interface ResultInputOk<O> {
    status: ResultStatus["OK"];
    ok: O;
    err?: never;
}

interface ResultInputErr<E> {
    status: ResultStatus["ERR"];
    ok?: never;
    err: E;
}

type ResultInput<O, E> = ResultInputOk<O> | ResultInputErr<E>;

export interface ResultOk<O, E> extends ResultSync<O, E> {
    status: ResultStatus["OK"];
    ok: O;
    err: ResultEmpty;
}

export interface ResultErr<O, E> extends ResultSync<O, E> {
    status: ResultStatus["ERR"];
    ok: ResultEmpty;
    err: E;
}

export type Result<O, E> = ResultOk<O, E> | ResultErr<O, E>;

/**
 * @description
 * A class representing a result of an operation that can either be successful (Ok) or failed (Err).
 *
 * @template O - The type of the successful result.
 * @template E - The type of the error result.
 */
export class ResultSync<O, E> {
    /**
     * @description
     * Indicates whether the result is successful.
     */
    public readonly status: ResultStatusUnion;

    /**
     * @description
     * The successful value or Empty if the result is error.
     */
    public readonly ok: O | ResultEmpty;

    /**
     * @description
     * The error value or Empty if the result is successful.
     */
    public readonly err: E | ResultEmpty;

    /**
     * @description
     * Constructs a new Result instance.
     *
     * @param ok - Indicates whether the result is successful.
     * @param value - The value of the successful result or Empty.
     * @param error - The error value or Empty.
     */
    constructor(args: ResultInput<O, E>) {
        this.status = args.status;
        this.ok = args.ok ?? ResultEmpty;
        this.err = args.err ?? ResultEmpty;
    }

    /**
     * @description
     * Retrieves the error value.
     *
     * @returns The error value.
     * @throws If the error value is empty. (ImpossibleError)
     */
    private getErr(): E {
        if (!this.isErr()) {
            throw new ImposibleError("error is empty");
        }

        return this.err;
    }

    /**
     * @description
     * Retrieves the successful result value.
     *
     * @returns The successful result value.
     * @throws If the value is empty. (ImpossibleError)
     */
    private getOk(): O {
        if (!this.isOk()) {
            throw new ImposibleError("value is empty");
        }

        return this.ok;
    }

    /**
     * @description
     * Checks if the result is successful.
     *
     * @returns True if the result is successful, false otherwise.
     */
    public isOk(): this is ResultOk<O, E> {
        return this.status === ResultStatus.OK;
    }

    /**
     * @description
     * Checks if the result is an error.
     *
     * @returns True if the result is an error, false otherwise.
     */
    public isErr(): this is ResultErr<O, E> {
        return this.status === ResultStatus.ERR;
    }

    /**
     * @description
     * Unwraps the result, returning the successful value or throwing the error.
     *
     * @returns The successful result value.
     * @throws The error value if the result is not successful.
     */
    public unwrap(): O {
        if (this.isErr()) {
            throw this.getErr();
        }
        return this.getOk();
    }

    /**
     * @description
     * Unwraps the result, returning the successful value or a fallback value.
     *
     * @template T - The type of the fallback value.
     * @param fallback - The fallback value to return if the result is not successful.
     * @returns The successful result value or the fallback value.
     */
    public unwrapOr<T>(fallback: T): T | O {
        if (this.isErr()) {
            return fallback;
        }
        return this.getOk();
    }

    /**
     * @description
     * Matches the result, executing a function based on whether it is successful or failed.
     *
     * @template TReturn - The type of the result of the match function.
     * @param args - An object containing the functions to execute for the successful and failed cases.
     * @returns The result of the executed function.
     */
    public match<TReturn>(args: {
        ok: (data: O) => TReturn;
        err: (error: E) => TReturn;
    }): TReturn {
        if (this.isErr()) {
            return args.err(this.getErr());
        }
        return args.ok(this.getOk());
    }

    /**
     * @description
     * Maps the Ok value of the Result to a new value.
     * The function is only executed if the Result is an Ok
     * and the result is used to create a new Ok value for the
     *
     * @template TOk - The type of the new successful result value.
     * @param fn - The function to map the successful result value.
     * @returns A new Result instance with the mapped value.
     */
    public map<TOk>(fn: (data: O) => TOk): Result<TOk, E> {
        if (this.isErr()) {
            return ResultSync.errSync(this.getErr());
        }
        return ResultSync.okSync(fn(this.getOk()));
    }

    /**
     * @description
     * Maps the error value of the Result to a new value.
     * The function is only executed if the Result is an Err
     * and the result is used to create a new Err value for the
     *
     * @template TErr - The type of the new error value.
     * @param fn - The function to map the error value.
     * @returns A new Result instance with the mapped error value.
     */
    public mapErr<TErr>(fn: (err: E) => TErr): Result<O, TErr> {
        if (this.isErr()) {
            return ResultSync.errSync(fn(this.getErr()));
        }

        return ResultSync.okSync(this.getOk());
    }

    /**
     * @description
     * Chains another Result to be executed if the current Result is an Ok.
     * The function is only executed if the Result is an Ok
     * and the result is used to create a new
     * the error types are combined.
     *
     * @template TResult - The type of the result of the chained operation.
     * @param fn - The function to execute if the result is successful.
     * @returns A new Result instance representing the result of the chained operation.
     */
    public andThen<TResult extends Result<unknown, unknown>>(
        fn: (t: O) => TResult,
    ): Result<InferOkTypes<TResult>, InferErrTypes<TResult> | E>;
    public andThen<TOk, TErr>(fn: (t: O) => Result<TOk, TErr>): Result<TOk, E | TErr>;
    public andThen(fn: (t: O) => Result<unknown, unknown>): Result<unknown, unknown> {
        if (this.isErr()) {
            return ResultSync.errSync(this.getErr());
        }
        return fn(this.getOk());
    }

    /**
     * @description
     * Chains another Result to be executed if the current Result is failed.
     * The function is only executed if the Result is failed
     * and the result is used to create a new
     * the successful types are combined.
     *
     * @template TResult - The type of the result of the chained operation.
     * @param fn - The function to execute if the result is failed.
     * @returns A new Result instance representing the result of the chained operation.
     */
    public orElse<TResult extends Result<unknown, unknown>>(
        fn: (t: E) => TResult,
    ): Result<O | InferOkTypes<TResult>, InferErrTypes<TResult>>;
    public orElse<TOk, TErr>(fn: (t: E) => Result<TOk, TErr>): Result<O | TOk, TErr>;
    public orElse(fn: (t: E) => Result<unknown, unknown>): Result<unknown, unknown> {
        if (this.isErr()) {
            return fn(this.getErr());
        }
        return ResultSync.okSync(this.getOk());
    }

    /**
     * @description
     * Executes a side-effect free function if the Result is an Ok.
     * The function is only executed if the Result is an Ok.
     * and the Result returned unchanged.
     * this function should not throw an error.
     *
     * @param fn - The function to execute.
     * @returns The original Result instance.
     */
    public andTee(fn: (ok: O) => unknown): Result<O, E> {
        if (this.isErr()) {
            return ResultSync.errSync(this.getErr());
        }

        try {
            fn(this.getOk());
        } catch (err) {
            throw new NoThrowAllowedError(
                `andTee should not throw new errors, please move it to andThen, ${err}`,
                { cause: err },
            );
        }

        return ResultSync.okSync(this.getOk());
    }

    /**
     * @description
     * Executes a side-effect free function if the Result is an Err.
     * The function is only executed if the Result is an Err
     * and the Result returned unchanged.
     * this function should not throw an error.
     *
     * @param fn - The function to execute.
     * @returns The original Result instance.
     */
    public orTee(fn: (err: E) => unknown): Result<O, E> {
        if (this.isOk()) {
            return ResultSync.okSync(this.getOk());
        }

        try {
            fn(this.getErr());
        } catch (err) {
            throw new NoThrowAllowedError(
                `orTee should not throw new errors, please move it to orElse, ${err}`,
                { cause: err },
            );
        }

        return ResultSync.errSync(this.getErr());
    }

    // ##################################################
    // ###########      STATIC METHODS      #############
    // ##################################################

    /**
     * @description
     * Creates a successful result.
     *
     * @template O - The type of the successful result value.
     * @template E - The type of the error value (default is never).
     * @param okValue - The value of the successful result.
     * @returns A successful Result instance.
     */
    static okSync<O>(okValue: O): Result<O, never> {
        return new ResultSync({ status: ResultStatus.OK, ok: okValue }) as never;
    }

    /**
     * @description
     * Creates a failed result.
     *
     * @template E - The type of the error value.
     * @template O - The type of the successful result value (default is never).
     * @param errorValue - The error value.
     * @returns A failed Result instance.
     */
    static errSync<E>(errorValue: E): Result<never, E> {
        return new ResultSync({ status: ResultStatus.ERR, err: errorValue }) as never;
    }

    /**
     * @description
     * Attempts to execute a side effect function and captures any thrown errors as a failed result.
     *
     * @param Ok - the Ok value
     * @param Err - The Err value.
     * @param OkArgs - An array of arguments of the main function
     * @returns A Result instance representing the outcome of the attempted function execution.
     */
    static safeTrySync<O, E, OArgs extends any[]>(safeArgs: {
        try: (...args: OArgs) => O;
        catch?: (error: unknown) => E;
    }): (...args: OArgs) => Result<O, E> {
        return (...args) => {
            try {
                const value = safeArgs.try(...args);
                return ResultSync.okSync(value);
            } catch (error) {
                if (safeArgs.catch) {
                    return ResultSync.errSync(safeArgs.catch(error));
                }
                return ResultSync.errSync(error as E);
            }
        };
    }

    /**
     * @description
     * Infer the Ok and Err types of the returned Result
     *
     * @template TArgs - Any arguments
     * @template TResult - A sync Result type
     * @param fn - The function to execute.
     * @returns A Result instance representing the outcome of the attempted function execution.
     */
    static inferSync<TArgs extends any[], TResult extends Result<unknown, unknown>>(
        fn: (...args: TArgs) => TResult,
    ): (...args: TArgs) => Result<InferOkTypes<TResult>, InferErrTypes<TResult>>;
    static inferSync(fn: (...args: unknown[]) => unknown): typeof fn {
        return fn;
    }
}

export const okSync = ResultSync.okSync;
export const errSync = ResultSync.errSync;
export const safeTrySync = ResultSync.safeTrySync;
export const inferSync = ResultSync.inferSync;

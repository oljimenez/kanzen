import { type Result, errSync, okSync } from "../sync/result-sync";
import type { InferErrTypes, InferOkTypes } from "../sync/types";
import type { InferAsyncErrTypes, InferAsyncOkTypes } from "./types";

/**
 * @description
 * A class representing an asynchronous result, which can be either an Ok or Err.
 * Implements the PromiseLike interface to allow chaining with promises.
 *
 * @template O - The type of the Ok value.
 * @template E - The type of the Err value.
 */
export class ResultAsync<O, E> implements PromiseLike<Result<O, E>> {
    /**
     * @param _promise - A promise that resolves to a Result.
     */
    private readonly _promise: Promise<Result<O, E>>;

    constructor(_promise: Promise<Result<O, E>>) {
        this._promise = _promise;
    }

    /**
     * @description
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     *
     * @param okFn - The callback to execute when the Promise is resolved.
     * @param errFn - The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    // biome-ignore lint/suspicious/noThenProperty: then need to be implemented on PromiseLike instances
    public then<ResultOk, ResultErr>(
        okFn?: (response: Result<O, E>) => ResultOk | PromiseLike<ResultOk>,
        errFn?: (reason: unknown) => ResultErr | PromiseLike<ResultErr>,
    ): PromiseLike<ResultOk | ResultErr> {
        return this._promise.then(okFn, errFn);
    }

    /**
     * @description
     * Checks if the result is successful.
     *
     * @returns True if the result is successful, false otherwise.
     */
    public async isOk(): Promise<boolean> {
        return this._promise.then((res) => res.isOk());
    }

    /**
     * @description
     * Checks if the result is an error.
     *
     * @returns True if the result is an error, false otherwise.
     */
    public async isErr(): Promise<boolean> {
        return this._promise.then((res) => res.isErr());
    }

    /**
     * @description
     * Unwraps the ResultAsync, returning the Ok value or throwing an error if it is an Err.
     *
     * @returns A promise that resolves to the Ok value.
     */
    public async unwrap(): Promise<O> {
        return this._promise.then((res) => res.unwrap());
    }

    /**
     * @description
     * Unwraps the ResultAsync, returning the Ok value or a default value if it is an Err.
     *
     * @param value - The default value to return if the ResultAsync is an Err.
     * @returns A promise that resolves to the Ok value or the default value.
     */
    public async unwrapOr<T>(value: T): Promise<T | O> {
        return this._promise.then((res) => res.unwrapOr(value));
    }

    /**
     * @description
     * Matches the ResultAsync, executing the appropriate callback based on whether it is an Ok or an Err.
     *
     * @param args - An object containing the Ok and Err callbacks.
     * @returns A promise that resolves to the result of the appropriate callback.
     */
    public async match<TResult>(args: {
        ok: (data: O) => TResult;
        err: (error: E) => TResult;
    }): Promise<TResult> {
        return this._promise.then((res) => res.match(args));
    }

    /**
     * @description
     * Maps the Ok value of the ResultAsync using the provided function.
     * The function is only executed if the ResultAsync is an Ok
     * and the result is used to create a new Ok value for the ResultAsync.
     *
     * @param fn - The function to apply to the Ok value.
     * @returns A new ResultAsync with the mapped Ok value.
     */
    public map<TOk>(fn: (data: O) => TOk): ResultAsync<TOk, E> {
        return new ResultAsync(this._promise.then((res) => res.map(fn)));
    }

    /**
     * @description
     * Maps the Err value of the ResultAsync using the provided function.
     * The function is only executed if the ResultAsync is an Err
     * and the result is used to create a new Err value for the ResultAsync.
     *
     * @param fn - The function to apply to the Err value.
     * @returns A new ResultAsync with the mapped Err value.
     */
    public mapErr<TErr>(fn: (err: E) => TErr): ResultAsync<O, TErr> {
        return new ResultAsync(this._promise.then((res) => res.mapErr(fn)));
    }

    /**
     * @description
     * Chains another ResultAsync to be executed if the current ResultAsync is an Ok.
     * The function is only executed if the ResultAsync is an Ok
     * and the result is used to create a new ResultAsync.
     * the error types are combined.
     *
     * @param fn - The function to apply to the Ok value.
     * @returns A new ResultAsync with the chained result.
     */
    public andThen<TResult extends Result<unknown, unknown>>(
        fn: (t: O) => Promise<TResult>,
    ): ResultAsync<InferOkTypes<TResult>, InferErrTypes<TResult> | E>;
    public andThen<TResult extends ResultAsync<unknown, unknown>>(
        fn: (t: O) => TResult,
    ): ResultAsync<InferAsyncOkTypes<TResult>, InferAsyncErrTypes<TResult> | E>;
    public andThen<TOk, TErr>(fn: (t: O) => ResultAsync<TOk, TErr>): ResultAsync<TOk, E | TErr>;
    public andThen(
        fn: (t: O) => ResultAsync<unknown, unknown> | Promise<Result<unknown, unknown>>,
    ): ResultAsync<unknown, unknown> {
        const promise = this._promise.then((res) =>
            res.match({
                ok: (ok) => {
                    const newValue = fn(ok);

                    if (newValue instanceof ResultAsync) {
                        return newValue._promise;
                    }

                    return newValue;
                },
                err: (error) => Promise.resolve(errSync(error)),
            }),
        );

        return new ResultAsync(promise);
    }

    /**
     * @description
     * Chains another ResultAsync to be executed if the current ResultAsync is an Err.
     * The function is only executed if the ResultAsync is an Err
     * and the result is used to create a new ResultAsync.
     * the Ok types are combined.
     *
     * @param fn - The function to apply to the Err value.
     * @returns A new ResultAsync with the chained result.
     */
    public orElse<TResult extends Result<unknown, unknown>>(
        fn: (t: E) => Promise<TResult>,
    ): ResultAsync<O | InferOkTypes<TResult>, InferErrTypes<TResult>>;
    public orElse<TResult extends ResultAsync<unknown, unknown>>(
        fn: (t: E) => TResult,
    ): ResultAsync<O | InferAsyncOkTypes<TResult>, InferAsyncErrTypes<TResult>>;
    public orElse<TOk, TErr>(fn: (t: E) => ResultAsync<TOk, TErr>): ResultAsync<O | TOk, TErr>;
    public orElse(
        fn: (t: E) => ResultAsync<unknown, unknown> | Promise<Result<unknown, unknown>>,
    ): ResultAsync<unknown, unknown> {
        const promise = this._promise.then((res) =>
            res.match({
                ok: (ok) => Promise.resolve(okSync(ok)),
                err: (error) => {
                    const errValue = fn(error);

                    if (errValue instanceof ResultAsync) {
                        return errValue._promise;
                    }

                    return errValue;
                },
            }),
        );

        return new ResultAsync(promise);
    }

    /**
     * @description
     * Executes a side-effect free function if the ResultAsync is an Ok.
     * The function is only executed if the ResultAsync is an Ok.
     * and the ResultAsync returned unchanged.
     * this function should not throw an error.
     *
     * @param fn - The function to execute.
     * @returns A new ResultAsync with the same Ok value.
     */
    public andTee(fn: (ok: O) => unknown): ResultAsync<O, E> {
        return new ResultAsync(this._promise.then((res) => res.andTee(fn)));
    }

    /**
     * @description
     * Executes a side-effect free function if the ResultAsync is an Err.
     * The function is only executed if the ResultAsync is an Err
     * and the ResultAsync returned unchanged.
     * this function should not throw an error.
     *
     * @param fn - The function to execute.
     * @returns A new ResultAsync with the same Err value.
     */
    public orTee(fn: (err: E) => unknown): ResultAsync<O, E> {
        return new ResultAsync(this._promise.then((res) => res.orTee(fn)));
    }
}
// ##################################################
// ###########      STATIC METHODS      #############
// ##################################################

/**
 * @description
 * Creates a ResultAsync instance of a Result instance
 * This utility function allow you to pass the coloring problem
 * of when you have an async result and you wanna stack other sync results
 *
 * @param result - The result instance you wanna convert to async result instance
 * @returns A ResultAsync instance with same Ok and Error values than the recieved Result
 */
export function toAsync<O, E>(result: Result<O, E>): ResultAsync<O, E> {
    return new ResultAsync(Promise.resolve(result));
}

/**
 * @description
 * Creates a ResultAsync instance with an Ok value.
 *
 * @param okValue - The Ok value.
 * @returns A ResultAsync instance with the Ok value.
 */
export function ok<O, E = never>(okValue: O): ResultAsync<O, E> {
    return new ResultAsync(Promise.resolve(okSync(okValue)));
}

/**
 * @description
 * Creates a ResultAsync instance with an Err value.
 *
 * @param errorValue - The Err value.
 * @returns A ResultAsync instance with the Err value.
 */
export function err<E, O = never>(errorValue: E): ResultAsync<O, E> {
    return new ResultAsync(Promise.resolve(errSync(errorValue)));
}

/**
 * @description
 * Attempts to execute an asynchronous function, capturing any errors as a ResultAsync.
 *
 * @param Ok - the Ok value
 * @param Err - The Err value.
 * @param OkArgs - An array of arguments of the main function
 * @returns A ResultAsync representing the result of the function.
 */
export function safeTry<Ok, Err, OkArgs extends any[]>(safeArgs: {
    try: (...args: OkArgs) => Promise<Ok>;
    catch?: (error: unknown) => Err;
}): (...args: OkArgs) => ResultAsync<Ok, Err> {
    return (...args) =>
        new ResultAsync(
            safeArgs
                .try(...args)
                .then((res) => okSync(res))
                .catch((error) => {
                    if (safeArgs.catch) {
                        return errSync(safeArgs.catch(error));
                    }
                    return errSync(error);
                }),
        );
}

/**
 * @description
 * Infer the Ok and Err types of the returned ResultAsync
 *
 * @template TArgs - Any arguments
 * @template TResult - ResultAsync type
 * @param fn - The function to execute.
 * @returns A ResultAsync instance representing the outcome of the attempted function execution.
 */
export function infer<TArgs extends any[], TResult extends ResultAsync<unknown, unknown>>(
    fn: (...args: TArgs) => TResult,
): (...args: TArgs) => ResultAsync<InferAsyncOkTypes<TResult>, InferAsyncErrTypes<TResult>>;
export function infer<TArgs extends any[], TResult extends Result<unknown, unknown>>(
    fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => ResultAsync<InferOkTypes<TResult>, InferErrTypes<TResult>>;
export function infer(fn: (...args: unknown[]) => unknown): typeof fn {
    return fn;
}

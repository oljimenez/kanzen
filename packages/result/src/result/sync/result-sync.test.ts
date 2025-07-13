import { describe, expect, it, vi } from "vitest";
import { ResultStatus } from "../enums";
import { ResultSync, errSync, inferSync, okSync, safeTrySync } from "./result-sync";

//############################################################
//##################### Result ###############################
//############################################################

describe("Result", () => {
    it("constructor should properly set status, value and error", () => {
        const okResult = new ResultSync({ status: ResultStatus.OK, ok: "value" });

        expect(okResult).instanceOf(ResultSync);
        expect(okResult.isOk()).toBe(true);
        expect(okResult.unwrap()).toBe("value");

        const errResult = new ResultSync({ status: ResultStatus.ERR, err: "error" });

        expect(errResult).instanceOf(ResultSync);
        expect(errResult.isErr()).toBe(true);
        expect(() => errResult.unwrap()).toThrow("error");
    });
});

//############################################################
//##################### isOk() ###############################
//############################################################

describe("Result.isOk()", () => {
    it("should return true when instance is created with OK status", () => {
        expect(okSync("test value").isOk()).toBe(true);
    });

    it("should return false when instance is created with ERR status", () => {
        expect(errSync("test error").isOk()).toBe(false);
    });
});

//############################################################
//##################### isErr() ##############################
//############################################################

describe("Result.isErr()", () => {
    it("should return true when instance is created with ERR status", () => {
        expect(errSync("test error").isErr()).toBe(true);
    });

    it("should return false when instance is created with OK status", () => {
        expect(okSync("test value").isErr()).toBe(false);
    });
});

//############################################################
//##################### unwrap() #############################
//############################################################

describe("Result.unwrap()", () => {
    it("should return the value for an Ok result", () => {
        const value = 2;
        const result = okSync(value);

        expect(result.unwrap()).toBe(value);
    });

    it("should work with complex objects for Ok results", () => {
        const complex = { id: 1, data: [1, 2, 3] };
        const result = okSync(complex);

        expect(result.unwrap()).toEqual(complex);
    });

    it("should throw the error for an Err result", () => {
        const error = new Error("test error");
        const result = errSync(error);

        expect(() => result.unwrap()).toThrow(error);
    });

    it("should throw with correct error message", () => {
        const errorMsg = "specific error message";
        const result = errSync(errorMsg);

        expect(() => result.unwrap()).toThrow(errorMsg);
    });
});

//############################################################
//##################### unwrapOr() ###########################
//############################################################

describe("Result.unwrapOr()", () => {
    it("should return the value for an Ok result", () => {
        const value = 42;
        const result = okSync(value);

        expect(result.unwrapOr(100)).toBe(value);
    });

    it("should return the fallback value for an Err result", () => {
        const fallback = "default value";
        const result = errSync(new Error("test error"));

        expect(result.unwrapOr(fallback)).toBe(fallback);
    });
});

//############################################################
//##################### match() ##############################
//############################################################

describe("Result.match()", () => {
    it("should call ok function with value when result is Ok", () => {
        const okFn = vi.fn().mockReturnValue("ok result");
        const errFn = vi.fn().mockReturnValue("err result");

        const value = "test value";
        const result = okSync(value);

        const matchResult = result.match({ ok: okFn, err: errFn });

        expect(okFn).toHaveBeenCalled();
        expect(errFn).not.toHaveBeenCalled();
        expect(matchResult).toBe("ok result");
    });

    it("should call err function with error when result is Err", () => {
        const okFn = vi.fn().mockReturnValue("ok result");
        const errFn = vi.fn().mockReturnValue("err result");

        const error = new Error("test error");
        const result = errSync(error);

        const matchResult = result.match({ ok: okFn, err: errFn });

        expect(errFn).toHaveBeenCalled();
        expect(okFn).not.toHaveBeenCalled();
        expect(matchResult).toBe("err result");
    });
});

//############################################################
//##################### map() ################################
//############################################################

describe("Result.map()", () => {
    it("should transform an Ok result's value using the provided function", () => {
        const result = okSync(5).map((value) => value * 2);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toBe(10);
    });

    it("should return a new Result with the transformed value", () => {
        const original = okSync("hello");
        const transformed = original.map((str) => str.toUpperCase());

        expect(transformed.unwrap()).toBe("HELLO");
        expect(original.unwrap()).toBe("hello"); // Original is unchanged
    });

    it("should not execute on Err results", () => {
        const mockMap = vi.fn();
        const error = new Error("test error");
        const result = errSync(error).map(mockMap);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow(error);
        expect(mockMap).not.toHaveBeenCalled();
    });
});

//############################################################
//##################### mapErr() #############################
//############################################################

describe("Result.mapErr()", () => {
    it("should transform an Err result's error using the provided function", () => {
        const result = errSync("error").mapErr((error) => `transformed: ${error}`);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("transformed: error");
    });

    it("should return a new Result with the transformed error", () => {
        const original = errSync("initial error");
        const transformed = original.mapErr((err) => new Error(`Enhanced: ${err}`));

        expect(() => transformed.unwrap()).toThrow("Enhanced: initial error");
        expect(() => original.unwrap()).toThrow("initial error"); // Original is unchanged
    });

    it("should not execute the function on Ok results", () => {
        const mockMapErr = vi.fn();
        const value = 42;
        const result = okSync(value).mapErr(mockMapErr);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toBe(value);
        expect(mockMapErr).not.toHaveBeenCalled();
    });
});

// ###########################################################
// #################### STATIC METHODS #######################
// ###########################################################

//############################################################
//##################### andThen() ############################
//############################################################

describe("Result.andThen()", () => {
    it("should transform success values with callback function", () => {
        const result = okSync(8).andThen((val) => okSync(val * 2));

        expect(result.unwrap()).toBe(16);
    });

    it("should support chaining multiple andThen calls", () => {
        const result = okSync(5).andThen((val) => okSync(val + 1));
        // .andThen((val) => okSync(val * 2));

        if (result.isOk()) {
            return result.ok;
        }

        expect(result.unwrap()).toBe(12);
    });

    it("should propagate errors from the original result", () => {
        const mockFn = vi.fn();
        const result = errSync(new Error("original error")).andThen(mockFn);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("original error");
        expect(mockFn).not.toHaveBeenCalled();
    });

    it("should propagate errors from the callback function", () => {
        const result = okSync(8).andThen(() => errSync(new Error("callback error")));

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("callback error");
    });
});

//############################################################
//##################### orElse() #############################
//############################################################

describe("Result.orElse()", () => {
    it("should return the original result if it's successful", () => {
        const result = okSync(42).orElse(() => okSync(100));

        expect(result.unwrap()).toBe(42);
    });

    it("should recover from error using callback function", () => {
        const result = errSync("failure").orElse(() => okSync("recovered"));

        expect(result.unwrap()).toBe("recovered");
    });

    it("should support chaining multiple orElse calls", () => {
        const result = errSync("first error")
            .orElse(() => errSync("second error"))
            .orElse(() => okSync("final recovery"));

        expect(result.unwrap()).toBe("final recovery");
    });

    it("should not call the callback function if result is ok", () => {
        const mockFn = vi.fn();
        const result = okSync("success").orElse(mockFn);

        expect(result.unwrap()).toBe("success");
        expect(mockFn).not.toHaveBeenCalled();
    });

    it("should propagate the new error if callback returns an error", () => {
        const result = errSync("original error").orElse(() => errSync(new Error("new error")));

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("new error");
    });
});

//############################################################
//##################### andTee() #############################
//############################################################

describe("Result.andTee()", () => {
    it("should call function with the result value without transforming it", () => {
        const spy = vi.fn();
        const result = okSync(42).andTee(spy);

        expect(result.unwrap()).toBe(42);
        expect(spy).toHaveBeenCalledWith(42);
    });

    it("should support chaining multiple andTee calls", () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();
        const result = okSync(5).andTee(spy1).andTee(spy2);

        expect(result.unwrap()).toBe(5);
        expect(spy1).toHaveBeenCalledWith(5);
        expect(spy2).toHaveBeenCalledWith(5);
    });

    it("should not call function when result is an error", () => {
        const spy = vi.fn();
        const result = errSync(new Error("error")).andTee(spy);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("error");
        expect(spy).not.toHaveBeenCalled();
    });

    it("should work in combination with other methods", () => {
        const spy = vi.fn();
        const result = okSync(10)
            .map((val) => val * 2)
            .andTee(spy)
            .map((val) => val + 5);

        expect(result.unwrap()).toBe(25);
        expect(spy).toHaveBeenCalledWith(20);
    });
});

//############################################################
//##################### orTee() ##############################
//############################################################

describe("Result.orTee()", () => {
    it("should call function with the error value without transforming it", () => {
        const spy = vi.fn();
        const error = new Error("test error");
        const result = errSync(error).orTee(spy);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("test error");
        expect(spy).toHaveBeenCalledWith(error);
    });

    it("should support chaining multiple orTee calls", () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();
        const error = new Error("chain error");
        const result = errSync(error).orTee(spy1).orTee(spy2);

        expect(result.isErr()).toBe(true);
        expect(() => result.unwrap()).toThrow("chain error");
        expect(spy1).toHaveBeenCalledWith(error);
        expect(spy2).toHaveBeenCalledWith(error);
    });

    it("should not call function when result is successful", () => {
        const spy = vi.fn();
        const result = okSync(42).orTee(spy);

        expect(result.unwrap()).toBe(42);
        expect(spy).not.toHaveBeenCalled();
    });

    it("should work in combination with other methods", () => {
        const spy = vi.fn();
        const result = errSync("initial error")
            .mapErr((err) => `${err}!`)
            .orTee(spy)
            .orElse(() => okSync("recovered"));

        expect(result.unwrap()).toBe("recovered");
        expect(spy).toHaveBeenCalledWith("initial error!");
    });
});

//############################################################
//##################### okSync() #############################
//############################################################

describe("Result.okSync() static", () => {
    it("should return a Result", () => {
        const result = okSync(2);
        const okResult = new ResultSync({ status: ResultStatus.OK, ok: 2 });

        expect(result).toStrictEqual(okResult);
    });

    it("should create a Result with OK status", () => {
        const result = okSync("test value");

        expect(result.isOk()).toBe(true);
        expect(result.isErr()).toBe(false);
    });

    it("should properly store the provided value", () => {
        const testValue = { complex: "object", with: [1, 2, 3] };
        const result = okSync(testValue);

        expect(result.unwrap()).toBe(testValue);
    });

    it("should have Empty as error value", () => {
        const result = okSync(42);

        expect(result).toEqual(new ResultSync({ status: ResultStatus.OK, ok: 42 }));
    });

    it("should handle different types correctly", () => {
        // Test with string
        const string = "string";
        const stringError = okSync(string);

        expect(stringError.isOk()).toBe(true);
        expect(stringError.unwrap()).toBe(string);

        // Test with number
        const number = 200;
        const numberError = okSync(number);

        expect(numberError.isOk()).toBe(true);
        expect(numberError.ok).toBe(number);

        // Test with boolean
        const boolean = false;
        const booleanError = okSync(boolean);

        expect(booleanError.isOk()).toBe(true);
        expect(booleanError.ok).toBe(boolean);

        // Test with object
        const object = { code: 200, message: "Success" };
        const objectError = okSync(object);

        expect(objectError.isOk()).toBe(true);
        expect(objectError.ok).toStrictEqual(object);
        expect(objectError.unwrap()).toStrictEqual(object);

        // Test with array
        const array = ["error1", "error2"];
        const arrayError = okSync(array);

        expect(arrayError.isOk()).toBe(true);
        expect(arrayError.ok).toStrictEqual(array);

        // Test with Ok instance

        const okInstance = okSync(new Map());

        expect(okInstance.isOk()).toBe(true);
        expect(okInstance.unwrap()).instanceOf(Map);
        expect(okInstance.unwrap()).toStrictEqual(new Map());
    });
});

//############################################################
//##################### errSync() ############################
//############################################################

describe("Result.errSync() static", () => {
    it("should return a Result", () => {
        const result = errSync(new Error());
        const errResult = new ResultSync({ status: ResultStatus.ERR, err: new Error() });

        expect(result).toStrictEqual(errResult);
    });

    it("should create a Result with ERR status", () => {
        const result = errSync("test error");
        expect(result.isErr()).toBe(true);
        expect(result.isOk()).toBe(false);
    });

    it("should properly store the provided error", () => {
        const testError = new Error("complex error");
        const result = errSync(testError);
        expect(() => result.unwrap()).toThrow(testError);
    });

    it("should have Empty as value", () => {
        const errorMessage = "some error";
        const result = errSync(errorMessage);
        expect(result).toEqual(new ResultSync({ status: ResultStatus.ERR, err: errorMessage }));
    });

    it("should handle different types correctly", () => {
        // Test with string error
        const string = "string error";
        const stringError = errSync(string);

        expect(stringError.isErr()).toBe(true);
        expect(() => stringError.unwrap()).toThrow(string);

        // Test with number error
        const number = 404;
        const numberError = errSync(number);

        expect(numberError.isErr()).toBe(true);
        expect(numberError.err).toBe(number);

        // Test with boolean error
        const boolean = false;
        const booleanError = errSync(boolean);

        expect(booleanError.isErr()).toBe(true);
        expect(booleanError.err).toBe(boolean);

        // Test with object error
        const object = { code: 500, message: "Server error" };
        const objectError = errSync(object);

        expect(objectError.isErr()).toBe(true);
        expect(objectError.err).toStrictEqual(object);
        expect(() => objectError.unwrap()).toThrow(expect.objectContaining(object));

        // Test with array error
        const array = ["error1", "error2"];
        const arrayError = errSync(array);

        expect(arrayError.isErr()).toBe(true);
        expect(arrayError.err).toStrictEqual(array);

        // Test with Error instance
        const classError = new Error("Error instance");
        const errorInstance = errSync(classError);

        expect(errorInstance.isErr()).toBe(true);
        expect(() => errorInstance.unwrap()).toThrow(Error);
        expect(() => errorInstance.unwrap()).toThrow(classError);
    });
});

//############################################################
//##################### safeTrySync() ########################
//############################################################

describe("Result.safeTrySync()", () => {
    it("should return Ok result with function success", () => {
        const value = 42;
        const fn = () => value;

        const result = safeTrySync({ try: fn });

        expect(result().isOk()).toBe(true);
        expect(result().unwrap()).toBe(value);
    });

    it("should return Err result when function throws", () => {
        const errorMessage = "Something went wrong";
        const fn = () => {
            throw new Error(errorMessage);
        };

        const result = safeTrySync({ try: fn });

        expect(result().isErr()).toBe(true);
        expect(() => result().unwrap()).toThrow(errorMessage);
    });

    it("should modify the error if `fnErr` is provided", () => {
        const fn = () => {
            throw new Error("Original error");
        };

        const message = "Custom error message";
        const fnErr = () => new Error(message);

        const result = safeTrySync({
            try: fn,
            catch: fnErr,
        });

        expect(() => result().unwrap()).toThrowError(message);
    });

    it("should handle arguments", () => {
        const fn = (arg1: number) => arg1 + 5;

        const result = safeTrySync({ try: fn });

        expect(result(10).unwrap()).toBe(15);
    });

    it("should handle multiple arguments", () => {
        const fn = (arg1: number, arg2: number, arg3: number) => arg1 + arg2 + arg3;

        const result = safeTrySync({ try: fn });

        expect(result(10, 5, 5).unwrap()).toBe(20);
    });
});

//############################################################
//##################### inferSync() ##########################
//############################################################

describe("Result.inferSync()", () => {
    it("should return the same Result", () => {
        const ok = 10;
        const mockFn = (value: number) => (value > 10 ? errSync(new Error()) : okSync(value));
        const inferFn = inferSync(mockFn);

        const result = mockFn(ok);

        expect(inferFn(ok)).toStrictEqual(result);
    });
});

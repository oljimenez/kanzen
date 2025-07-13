import { type ResultAsync, r } from "@kanzen/result";
import type { FetchError } from "./error";
import { SafeResponse } from "./response";

export type FetchParameters = Parameters<typeof fetch>;

export function safeFetch<Ok>(...args: FetchParameters): ResultAsync<SafeResponse<Ok>, FetchError> {
    return r.safeTry<SafeResponse<Ok>, FetchError, []>(async () => {
        return new SafeResponse<Ok>(await fetch(...args));
    })();
}

export type SafeFetch = (...args: FetchParameters) => SafeResponse;

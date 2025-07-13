export class AbortError extends DOMException {
    override name = "AbortError" as const;
}

export class NotAllowedError extends DOMException {
    override name = "NotAllowedError" as const;
}

export type ResponseMethodError = AbortError | TypeError;

export type FetchError = AbortError | NotAllowedError | TypeError;

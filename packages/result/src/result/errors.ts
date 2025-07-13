export class ImposibleError extends Error {
    name: string = "ImposibleError" as const;

    constructor(message: string, options?: { cause?: unknown }) {
        super(`[result] ImpossibleError: ${message}`, options);
    }
}

export class NoThrowAllowedError extends Error {
    name: string = "NoThrowAllowedError" as const;

    constructor(message: string, options: { cause?: unknown }) {
        super(`[result] NoThrowAllowedError: ${message}`, options);
    }
}

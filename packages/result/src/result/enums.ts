export const ResultStatus = {
    OK: "ok",
    ERR: "err",
} as const;

export type ResultStatus = typeof ResultStatus;

export type ResultStatusUnion = ResultStatus[keyof ResultStatus];

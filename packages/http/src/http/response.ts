import { type ResultAsync, r } from "@kanzen/result";
import type { ResponseMethodError } from "./error";

export class SafeResponse<Ok = unknown> {
    private response: Response;

    constructor(response: Response) {
        this.response = response;
    }

    /**
     * Access to the Response status code
     */
    public get status(): number {
        return this.response.status;
    }

    /**
     * Access to the Response status text
     */
    public get statusText(): string {
        return this.response.statusText;
    }

    /**
     * Check if the Response was successful (status in the range 200-299)
     */
    public get ok(): boolean {
        return this.response.ok;
    }

    /**
     * Access to the Response headers
     */
    public get headers(): Headers {
        return this.response.headers;
    }

    /**
     * Access to the Response type
     */
    public get type(): ResponseType {
        return this.response.type;
    }

    /**
     * Access to the Response URL
     */
    public get url(): string {
        return this.response.url;
    }

    /**
     * Check if the Response is redirected
     */
    public get redirected(): boolean {
        return this.response.redirected;
    }

    /**
     * Clone the response
     */
    public clone(): SafeResponse<Ok> {
        return new SafeResponse(this.response.clone());
    }

    /**
     * Returns a ResultAsync for text content
     */
    public text(): ResultAsync<string, ResponseMethodError> {
        return r.safeTry<string, ResponseMethodError, []>(() => this.response.text())();
    }

    public json<TValue = Ok>(): ResultAsync<TValue, ResponseMethodError | SyntaxError> {
        return r.safeTry<TValue, ResponseMethodError | SyntaxError, []>(() =>
            this.response.json(),
        )();
    }

    /**
     * Returns a ResultAsync for formData content
     */
    public formData(): ResultAsync<FormData, ResponseMethodError> {
        return r.safeTry<FormData, ResponseMethodError, []>(() => this.response.formData())();
    }

    /**
     * Returns a ResultAsync for blob content
     */
    public blob(): ResultAsync<Blob, ResponseMethodError> {
        return r.safeTry<Blob, ResponseMethodError, []>(() => this.response.blob())();
    }

    /**
     * Returns a ResultAsync for arrayBuffer content
     */
    public arrayBuffer(): ResultAsync<ArrayBuffer, ResponseMethodError | RangeError> {
        return r.safeTry<ArrayBuffer, ResponseMethodError | RangeError, []>(() =>
            this.response.arrayBuffer(),
        )();
    }

    /**
     * Returns a ResultAsync for bytes content
     */
    public bytes(): ResultAsync<Uint8Array, ResponseMethodError | RangeError> {
        return r.safeTry<Uint8Array, ResponseMethodError | RangeError, []>(() =>
            this.response.bytes(),
        )();
    }
}

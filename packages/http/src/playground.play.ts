import { type ResultAsync, r } from "@kanzen/result";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";
import type { FetchError } from "./http/error";
import { type FetchParameters, safeFetch } from "./http/fetch";
import type { SafeResponse } from "./http/response";

interface ServiceOptions {
    options?: NonNullable<FetchParameters[1]>;
    onFetch?: (response: ResultAsync<SafeResponse, FetchError>) => ResultAsync<unknown, unknown>;
}

interface EndpointOptions extends Omit<RequestInit, "body" | "method"> {
    body: Record<string, any>;
    params: Record<string, any>;
    searchParams: Record<string, any>;
    method: "POST" | "GET" | "PATCH" | "PUT" | "DELETE";
}

function validateSchema(
    schema: StandardSchemaV1,
    data: unknown,
): ResultAsync<Record<string, any>, Error> {
    const result = schema["~standard"].validate(data);

    if (result instanceof Promise) {
        return r.err(new Error("Some Error"));
    }

    if (result.issues) {
        return r.err(new Error(result.issues[0].message));
    }

    return r.ok(result.value as Record<string, any>);
}

const parseInput = r.infer(
    async (
        endpoint: Endpoint,
        {
            body,
            params,
            searchParams,
        }: {
            body: Record<string, any>;
            params: Record<string, any>;
            searchParams: Record<string, any>;
        },
    ) => {
        const bodyResult = await validateSchema(endpoint.schema.body, body);

        if (bodyResult.isErr()) {
            return r.err(bodyResult.err);
        }

        const paramsResult = await validateSchema(endpoint.schema.params, params);

        if (paramsResult.isErr()) {
            return r.err(paramsResult.err);
        }

        const searchParamsResult = await validateSchema(endpoint.schema.searchParams, searchParams);

        if (searchParamsResult.isErr()) {
            return r.err(searchParamsResult.err);
        }

        const url = new URL(endpoint.path, "");

        Object.entries(paramsResult.ok).forEach(([key, value]) => {
            url.pathname.replace(`[${key}]`, value);
        });

        Object.entries(searchParamsResult.ok).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const parsedBody = JSON.stringify(bodyResult.ok);

        return r.ok({
            url,
            body: parsedBody,
        });
    },
);

function service({ onFetch, options }: ServiceOptions) {
    return <TEndpoint extends Endpoint>(
        endpoint: TEndpoint,
        endpointOptions: EndpointOptions,
    ): ResultAsync<
        StandardSchemaV1.InferOutput<TEndpoint["schema"]["response"]>,
        StandardSchemaV1.InferOutput<TEndpoint["schema"]["errors"]>
    > => {
        const { body, params, searchParams, ...restEndpointOptions } = endpointOptions;

        const response = parseInput(endpoint, { body, params, searchParams }).andThen((data) =>
            safeFetch(data.url, {
                ...options,
                ...restEndpointOptions,
                body: data.body,
            }),
        );

        const fetchResponse = onFetch ? onFetch(response) : response;

        return fetchResponse
            .andThen((data) => validateSchema(endpoint.schema.response, data))
            .orElse((error) => validateSchema(endpoint.schema.errors, error));
    };
}

const productService = service({
    onFetch: (response) => {
        return response.andThen((response) => response.json());
    },
});

interface Endpoint extends RequestInit {
    path: string;
    schema: EndpointSchema;
}

function endpoint<TEndpoint extends Endpoint>(endpoint: TEndpoint): TEndpoint {
    return endpoint;
}

const endpoint1 = endpoint({
    path: "sdsd",
    schema: {
        response: z.string(),
        errors: z.number(),
        body: z.object({
            asd: z.string(),
        }),
        params: z.object({
            asd: z.string(),
        }),
        searchParams: z.object({
            asd: z.string(),
        }),
    },
});

const data2 = productService(endpoint1, { method: "POST", body: {}, params: {}, searchParams: {} });

interface EndpointSchema {
    params: StandardSchemaV1;
    body: StandardSchemaV1;
    searchParams: StandardSchemaV1;
    errors: StandardSchemaV1;
    response: StandardSchemaV1;
}

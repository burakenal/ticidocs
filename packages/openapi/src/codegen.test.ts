import { describe, expect, it } from "vitest";
import {
  assertAllowedOrigin,
  createDefaultSampleContext,
  generateCodeSamples,
  parseOpenApiDocument,
} from "./index.js";

const sample = {
  openapi: "3.1.0",
  info: { title: "Demo", version: "1.0.0" },
  servers: [{ url: "https://api.example.com" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/products/{id}": {
      get: {
        operationId: "getProduct",
        summary: "Get product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", example: 1 },
          },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
  },
};

describe("generateCodeSamples", () => {
  it("produces curl and language samples", () => {
    const doc = parseOpenApiDocument(sample, { basePath: "api" });
    const operation = doc.operations[0]!;
    const samples = generateCodeSamples(createDefaultSampleContext(doc, operation));
    expect(samples.map((s) => s.language)).toEqual([
      "curl",
      "javascript",
      "typescript",
      "python",
      "csharp",
    ]);
    expect(samples[0]?.code).toContain("curl -X GET");
    expect(samples[0]?.code).toContain("/products/1");
    expect(samples[0]?.code).toContain("Authorization: Bearer");
  });
});

describe("assertAllowedOrigin", () => {
  it("allows configured origins only", () => {
    expect(() =>
      assertAllowedOrigin("https://api.example.com/products", [
        "https://api.example.com",
      ]),
    ).not.toThrow();
    expect(() =>
      assertAllowedOrigin("https://evil.example/x", ["https://api.example.com"]),
    ).toThrow(/allowedOrigins/);
  });
});

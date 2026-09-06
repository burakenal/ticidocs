import { describe, expect, it } from "vitest";
import {
  assertAllowedOrigin,
  createDefaultSampleContext,
  generateCodeSamples,
  generateHttpSamples,
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

describe("generateHttpSamples", () => {
  it("builds multi-language samples from a plain HTTP request", () => {
    const samples = generateHttpSamples({
      method: "POST",
      url: "https://localhost:44312/api/v1/e-archive/invoices/draft",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": "ih_live_...",
      },
      body: JSON.stringify({ providerCode: "GibEArsiv" }, null, 2),
    });

    expect(samples.map((s) => s.language)).toEqual([
      "curl",
      "javascript",
      "typescript",
      "python",
      "csharp",
    ]);
    expect(samples[0]?.code).toContain("curl -X POST");
    expect(samples[0]?.code).toContain("/api/v1/e-archive/invoices/draft");
    expect(samples[0]?.code).toContain("X-Api-Key: ih_live_...");
    expect(samples[1]?.code).toContain("await fetch");
    expect(samples[3]?.code).toContain("import requests");
    expect(samples[4]?.code).toContain("HttpClient");
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

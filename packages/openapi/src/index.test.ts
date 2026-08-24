import { describe, expect, it } from "vitest";
import { parseOpenApiDocument } from "./index.js";

const sample = {
  openapi: "3.1.0",
  info: { title: "Demo API", version: "1.0.0", description: "Demo" },
  servers: [{ url: "https://api.example.com" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      apiKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
    },
    schemas: {
      Product: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          price: { type: "number" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/products": {
      get: {
        operationId: "listProducts",
        summary: "List products",
        tags: ["Products"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: "createProduct",
        summary: "Create product",
        tags: ["Products"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },
    "/products/{id}": {
      get: {
        summary: "Get product",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
        },
      },
    },
  },
};

describe("parseOpenApiDocument", () => {
  it("extracts operations, schemas, and security", () => {
    const doc = parseOpenApiDocument(sample, { basePath: "api" });
    expect(doc.title).toBe("Demo API");
    expect(doc.operations).toHaveLength(3);
    expect(doc.schemas.Product?.type).toBe("object");
    expect(doc.securitySchemes.bearerAuth?.scheme).toBe("bearer");

    const list = doc.operations.find((op) => op.operationId === "listProducts");
    expect(list?.slug).toBe("api/listproducts");
    expect(list?.method).toBe("get");
    expect(list?.parameters[0]?.name).toBe("limit");
    expect(list?.responses[0]?.status).toBe("200");
  });
});

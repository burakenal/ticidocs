import { describe, expect, it } from "vitest";
import { parseArgs } from "./args.js";

describe("parseArgs", () => {
  it("parses name and template", () => {
    const parsed = parseArgs(["my-api", "--template=api", "--yes", "--github"]);
    expect(parsed.projectName).toBe("my-api");
    expect(parsed.template).toBe("api");
    expect(parsed.yes).toBe(true);
    expect(parsed.github).toBe(true);
  });

  it("rejects unknown templates", () => {
    expect(() => parseArgs(["--template=nope"])).toThrow(/Invalid template/);
  });
});

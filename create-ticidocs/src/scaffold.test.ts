import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { scaffold } from "./scaffold.js";

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const temps: string[] = [];

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("scaffold", () => {
  it("creates an api project with openapi and workspace deps", async () => {
    const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ticidocs-"));
    temps.push(targetDir);

    await scaffold({
      packageRoot,
      targetDir,
      projectName: "demo-api",
      template: "api",
      github: true,
      linkWorkspace: true,
    });

    const pkg = JSON.parse(
      await fs.readFile(path.join(targetDir, "package.json"), "utf8"),
    ) as { name: string; dependencies: Record<string, string> };
    expect(pkg.name).toBe("demo-api");
    expect(pkg.dependencies["@ticidocs/core"]).toBe("workspace:*");

    await fs.access(path.join(targetDir, "openapi", "openapi.yaml"));
    await fs.access(path.join(targetDir, "app", "[locale]", "[[...slug]]", "page.tsx"));

    const config = await fs.readFile(path.join(targetDir, "docs.config.ts"), "utf8");
    expect(config).toContain('name: "Demo Api"');
    expect(config).toContain("openapi/openapi.yaml");
    expect(config).toContain("github");
  });
});

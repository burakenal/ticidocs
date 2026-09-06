import { beforeEach, describe, expect, it } from "vitest";
import {
  authProfilesStorageKey,
  deleteProfile,
  documentAuthKey,
  getActiveProfile,
  readAuthProfiles,
  setActiveProfileId,
  upsertProfile,
} from "./auth-profiles.js";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

describe("auth-profiles", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
  });

  it("builds document key from sourcePath then title", () => {
    expect(
      documentAuthKey({ sourcePath: "./openapi/a.json", title: "A" }),
    ).toBe("./openapi/a.json");
    expect(documentAuthKey({ title: "Marketplace" })).toBe("Marketplace");
  });

  it("returns empty store when nothing saved", () => {
    expect(readAuthProfiles("doc-a")).toEqual({
      profiles: [],
      activeProfileId: null,
    });
  });

  it("upserts a new profile and sets it active", () => {
    const store = upsertProfile("doc-a", {
      name: " Dev ",
      authValues: { ApiKey: "ih_live_x" },
      basicAuth: {},
    });

    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0]?.name).toBe("Dev");
    expect(store.profiles[0]?.authValues.ApiKey).toBe("ih_live_x");
    expect(store.activeProfileId).toBe(store.profiles[0]?.id);
    expect(getActiveProfile(store)?.name).toBe("Dev");

    const key = authProfilesStorageKey("doc-a");
    expect(window.localStorage.getItem(key)).toContain("Dev");
  });

  it("updates an existing profile in place", () => {
    const created = upsertProfile("doc-a", {
      name: "Dev",
      authValues: { ApiKey: "old" },
      basicAuth: {},
    });
    const id = created.profiles[0]!.id;

    const updated = upsertProfile("doc-a", {
      id,
      name: "Dev",
      authValues: { ApiKey: "new", TenantId: "t1" },
      basicAuth: { Basic: { username: "u", password: "p" } },
    });

    expect(updated.profiles).toHaveLength(1);
    expect(updated.profiles[0]?.authValues).toEqual({
      ApiKey: "new",
      TenantId: "t1",
    });
    expect(updated.profiles[0]?.basicAuth.Basic).toEqual({
      username: "u",
      password: "p",
    });
    expect(updated.activeProfileId).toBe(id);
  });

  it("ignores blank profile names", () => {
    const store = upsertProfile("doc-a", {
      name: "   ",
      authValues: { ApiKey: "x" },
      basicAuth: {},
    });
    expect(store.profiles).toHaveLength(0);
  });

  it("deletes a profile and clears active when needed", () => {
    const created = upsertProfile("doc-a", {
      name: "Dev",
      authValues: { ApiKey: "x" },
      basicAuth: {},
    });
    const id = created.profiles[0]!.id;

    const after = deleteProfile("doc-a", id);
    expect(after.profiles).toHaveLength(0);
    expect(after.activeProfileId).toBeNull();
  });

  it("sets and clears active profile id", () => {
    const a = upsertProfile("doc-a", {
      name: "A",
      authValues: {},
      basicAuth: {},
    });
    const b = upsertProfile("doc-a", {
      name: "B",
      authValues: {},
      basicAuth: {},
    });
    const idA = a.profiles[0]!.id;
    const idB = b.profiles.find((p) => p.name === "B")!.id;

    expect(setActiveProfileId("doc-a", idA).activeProfileId).toBe(idA);
    expect(setActiveProfileId("doc-a", null).activeProfileId).toBeNull();
    expect(setActiveProfileId("doc-a", idB).activeProfileId).toBe(idB);
    expect(setActiveProfileId("doc-a", "missing").activeProfileId).toBeNull();
  });

  it("scopes profiles per document key", () => {
    upsertProfile("marketplace", {
      name: "Hub",
      authValues: { ApiKey: "hub" },
      basicAuth: {},
    });
    upsertProfile("earchive", {
      name: "EA",
      authValues: { ApiKey: "ea" },
      basicAuth: {},
    });

    expect(readAuthProfiles("marketplace").profiles[0]?.authValues.ApiKey).toBe(
      "hub",
    );
    expect(readAuthProfiles("earchive").profiles[0]?.authValues.ApiKey).toBe(
      "ea",
    );
  });

  it("tolerates corrupt localStorage JSON", () => {
    window.localStorage.setItem(authProfilesStorageKey("bad"), "{not-json");
    expect(readAuthProfiles("bad")).toEqual({
      profiles: [],
      activeProfileId: null,
    });
  });
});

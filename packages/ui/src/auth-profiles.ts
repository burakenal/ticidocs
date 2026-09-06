/** Per-document auth profiles for Try It (localStorage). */

export type AuthBasicCreds = { username: string; password: string };

export type AuthProfile = {
  id: string;
  name: string;
  authValues: Record<string, string>;
  basicAuth: Record<string, AuthBasicCreds>;
  updatedAt: number;
};

export type AuthProfileStore = {
  profiles: AuthProfile[];
  activeProfileId: string | null;
};

const STORAGE_PREFIX = "ticidocs.authProfiles:";

export function authProfilesStorageKey(documentKey: string): string {
  return `${STORAGE_PREFIX}${documentKey}`;
}

export function documentAuthKey(document: {
  sourcePath?: string;
  title: string;
}): string {
  return document.sourcePath ?? document.title;
}

function emptyStore(): AuthProfileStore {
  return { profiles: [], activeProfileId: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBasicAuth(
  value: unknown,
): Record<string, AuthBasicCreds> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, AuthBasicCreds> = {};
  for (const [id, creds] of Object.entries(value)) {
    if (!isRecord(creds)) {
      continue;
    }
    result[id] = {
      username: typeof creds.username === "string" ? creds.username : "",
      password: typeof creds.password === "string" ? creds.password : "",
    };
  }
  return result;
}

function parseAuthValues(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [id, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      result[id] = entry;
    }
  }
  return result;
}

function parseProfile(value: unknown): AuthProfile | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    authValues: parseAuthValues(value.authValues),
    basicAuth: parseBasicAuth(value.basicAuth),
    updatedAt:
      typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
  };
}

function parseStore(raw: string | null): AuthProfileStore {
  if (!raw) {
    return emptyStore();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return emptyStore();
    }
    const profiles = Array.isArray(parsed.profiles)
      ? parsed.profiles.flatMap((item) => {
          const profile = parseProfile(item);
          return profile ? [profile] : [];
        })
      : [];
    const activeProfileId =
      typeof parsed.activeProfileId === "string"
        ? parsed.activeProfileId
        : null;
    const activeExists = profiles.some((p) => p.id === activeProfileId);
    return {
      profiles,
      activeProfileId: activeExists ? activeProfileId : null,
    };
  } catch {
    return emptyStore();
  }
}

export function readAuthProfiles(documentKey: string): AuthProfileStore {
  if (typeof window === "undefined") {
    return emptyStore();
  }
  try {
    return parseStore(
      window.localStorage.getItem(authProfilesStorageKey(documentKey)),
    );
  } catch {
    return emptyStore();
  }
}

export function writeAuthProfiles(
  documentKey: string,
  store: AuthProfileStore,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      authProfilesStorageKey(documentKey),
      JSON.stringify(store),
    );
  } catch {
    // ignore quota / private mode
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `auth-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function upsertProfile(
  documentKey: string,
  input: {
    id?: string | null;
    name: string;
    authValues: Record<string, string>;
    basicAuth: Record<string, AuthBasicCreds>;
  },
): AuthProfileStore {
  const store = readAuthProfiles(documentKey);
  const name = input.name.trim();
  if (!name) {
    return store;
  }

  const now = Date.now();
  let next: AuthProfile;

  if (input.id) {
    const existing = store.profiles.find((p) => p.id === input.id);
    if (existing) {
      next = {
        ...existing,
        name,
        authValues: { ...input.authValues },
        basicAuth: { ...input.basicAuth },
        updatedAt: now,
      };
      const profiles = store.profiles.map((p) =>
        p.id === next.id ? next : p,
      );
      const updated: AuthProfileStore = {
        profiles,
        activeProfileId: next.id,
      };
      writeAuthProfiles(documentKey, updated);
      return updated;
    }
  }

  next = {
    id: input.id && !store.profiles.some((p) => p.id === input.id)
      ? input.id
      : newId(),
    name,
    authValues: { ...input.authValues },
    basicAuth: { ...input.basicAuth },
    updatedAt: now,
  };
  const updated: AuthProfileStore = {
    profiles: [...store.profiles, next],
    activeProfileId: next.id,
  };
  writeAuthProfiles(documentKey, updated);
  return updated;
}

export function deleteProfile(
  documentKey: string,
  profileId: string,
): AuthProfileStore {
  const store = readAuthProfiles(documentKey);
  const profiles = store.profiles.filter((p) => p.id !== profileId);
  const updated: AuthProfileStore = {
    profiles,
    activeProfileId:
      store.activeProfileId === profileId ? null : store.activeProfileId,
  };
  writeAuthProfiles(documentKey, updated);
  return updated;
}

export function setActiveProfileId(
  documentKey: string,
  profileId: string | null,
): AuthProfileStore {
  const store = readAuthProfiles(documentKey);
  if (profileId !== null && !store.profiles.some((p) => p.id === profileId)) {
    const updated: AuthProfileStore = { ...store, activeProfileId: null };
    writeAuthProfiles(documentKey, updated);
    return updated;
  }
  const updated: AuthProfileStore = { ...store, activeProfileId: profileId };
  writeAuthProfiles(documentKey, updated);
  return updated;
}

export function getActiveProfile(
  store: AuthProfileStore,
): AuthProfile | null {
  if (!store.activeProfileId) {
    return null;
  }
  return store.profiles.find((p) => p.id === store.activeProfileId) ?? null;
}

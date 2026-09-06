"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ticidocs.codeLanguage";

const LANGUAGE_LABELS: Record<string, string> = {
  curl: "cURL",
  bash: "cURL",
  shell: "cURL",
  sh: "cURL",
  javascript: "JavaScript",
  js: "JavaScript",
  node: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  csharp: "C#",
  cs: "C#",
  go: "Go",
  golang: "Go",
  ruby: "Ruby",
  php: "PHP",
  java: "Java",
  kotlin: "Kotlin",
  rust: "Rust",
  http: "HTTP",
  json: "JSON",
};

/** Map fence / sample ids onto a stable preference key. */
export function normalizeLanguageId(language: string): string {
  const key = language.trim().toLowerCase();
  switch (key) {
    case "bash":
    case "shell":
    case "sh":
    case "curl":
      return "curl";
    case "js":
    case "javascript":
    case "node":
      return "javascript";
    case "ts":
    case "typescript":
      return "typescript";
    case "py":
    case "python":
      return "python";
    case "cs":
    case "csharp":
    case "c#":
      return "csharp";
    case "golang":
      return "go";
    default:
      return key;
  }
}

export function languageLabel(language: string): string {
  const key = language.trim().toLowerCase();
  return (
    LANGUAGE_LABELS[key] ??
    LANGUAGE_LABELS[normalizeLanguageId(key)] ??
    language
  );
}

export function pickPreferredLanguage(
  available: readonly string[],
  preferred?: string | null,
): string {
  if (available.length === 0) {
    return "curl";
  }
  if (preferred) {
    const preferredNorm = normalizeLanguageId(preferred);
    const match = available.find(
      (item) => normalizeLanguageId(item) === preferredNorm,
    );
    if (match) {
      return match;
    }
  }
  return available[0]!;
}

export function readStoredCodeLanguage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredCodeLanguage(language: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, normalizeLanguageId(language));
  } catch {
    // ignore quota / private mode
  }
}

export function usePreferredCodeLanguage(
  available: readonly string[],
): [string, (language: string) => void] {
  const fallback = available[0] ?? "curl";
  const availableKey = available.join("\0");
  const [language, setLanguageState] = useState(fallback);

  useEffect(() => {
    const langs = availableKey ? availableKey.split("\0") : [];
    setLanguageState(pickPreferredLanguage(langs, readStoredCodeLanguage()));
  }, [availableKey]);

  function setLanguage(next: string) {
    setLanguageState(next);
    writeStoredCodeLanguage(next);
  }

  const langs = availableKey ? availableKey.split("\0") : [];
  const active =
    langs.find((item) => item === language) ??
    pickPreferredLanguage(langs, language) ??
    fallback;

  return [active, setLanguage];
}

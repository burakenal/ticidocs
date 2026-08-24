export interface SearchCopy {
  buttonLabel: string;
  buttonAriaLabel: string;
  dialogAriaLabel: string;
  placeholder: string;
  emptyHint: string;
  noResults: string;
  keyboardHint: string;
}

const en: SearchCopy = {
  buttonLabel: "Search...",
  buttonAriaLabel: "Search documentation",
  dialogAriaLabel: "Search documentation",
  placeholder: "Search documentation...",
  emptyHint: "Type to search",
  noResults: "No results",
  keyboardHint: "↑↓ navigate · Enter open · Esc close",
};

const tr: SearchCopy = {
  buttonLabel: "Ara...",
  buttonAriaLabel: "Dokümanlarda ara",
  dialogAriaLabel: "Dokümanlarda ara",
  placeholder: "Dokümanlarda ara...",
  emptyHint: "Aramak için yazın",
  noResults: "Sonuç bulunamadı",
  keyboardHint: "↑↓ gezin · Enter aç · Esc kapat",
};

const byLocale: Record<string, SearchCopy> = {
  en,
  tr,
};

export function getSearchCopy(locale: string): SearchCopy {
  const base = locale.split(/[-_]/)[0]?.toLowerCase() ?? "en";
  return byLocale[base] ?? en;
}

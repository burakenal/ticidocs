"use client";

import { createContext, useContext } from "react";

const CodeGroupContext = createContext(false);

export function CodeGroupProvider({
  children,
  value = true,
}: {
  children: React.ReactNode;
  value?: boolean;
}) {
  return (
    <CodeGroupContext.Provider value={value}>
      {children}
    </CodeGroupContext.Provider>
  );
}

export function useInCodeGroup(): boolean {
  return useContext(CodeGroupContext);
}

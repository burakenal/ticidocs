import { redirect } from "next/navigation";
import { localePath, resolveDefaultVersion } from "@ticidocs/core";
import { getDocsConfig } from "../lib/docs";

export default function HomePage() {
  const config = getDocsConfig();
  redirect(
    localePath(
      config.defaultLocale,
      "",
      resolveDefaultVersion(config),
    ),
  );
}

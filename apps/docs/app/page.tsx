import { redirect } from "next/navigation";
import { getDocsConfig } from "../lib/docs";

export default function HomePage() {
  redirect(`/${getDocsConfig().defaultLocale}`);
}

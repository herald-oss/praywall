import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and next/navigation: every link
// and redirect keeps the visitor's current language.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

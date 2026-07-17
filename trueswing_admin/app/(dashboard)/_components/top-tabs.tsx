"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "@/components/nav/is-active";

const base =
  "cursor-pointer rounded-full px-5 py-1.5 text-sm font-medium transition-colors";
const on =
  "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white";
const off =
  "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";

// `href` is where the tab navigates; `match` is the prefix that keeps it
// active. Technical has no page of its own, so it lands on its first sub-page
// while still highlighting for any /technical/* route.
const TABS = [
  { href: "/business", match: "/business", label: "Business" },
  { href: "/technical/users", match: "/technical", label: "Technical" },
];

export default function TopTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-full border border-black/[.08] bg-zinc-100 p-1 dark:border-white/[.1] dark:bg-zinc-900">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${base} ${isActive(pathname, tab.match) ? on : off}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

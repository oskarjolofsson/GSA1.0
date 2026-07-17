"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "@/components/nav/is-active";

const base =
  "block cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const on =
  "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";
const off =
  "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60";

const ITEMS = [
  { href: "/technical/users", label: "Users" },
  { href: "/technical/db-objects", label: "DB-objects" },
];

export default function TechnicalSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-24 h-[calc(100vh-8rem)] w-52 shrink-0 overflow-y-auto border-r border-black/[.06] pr-4 dark:border-white/[.08]">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Technical
      </p>
      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${base} ${isActive(pathname, item.href, true) ? on : off}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

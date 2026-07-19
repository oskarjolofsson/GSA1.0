"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isActive } from "@/features/shared/utils/is-active";

const base =
  "block cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const on = "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";
const off =
  "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60";

export type SidebarItem = { href: string; label: string };

function SidebarNav({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: SidebarItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`${base} ${isActive(pathname, item.href, true) ? on : off}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default function Sidebar({
  title,
  items,
}: {
  title: string;
  items: SidebarItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-52 shrink-0 overflow-y-auto border-r border-black/[.06] pr-4 md:block dark:border-white/[.08]">
        <SidebarNav title={title} items={items} pathname={pathname} />
      </aside>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${title} menu`}
        className="inline-flex items-center gap-2 rounded-lg border border-black/[.08] px-3 py-2 text-sm font-medium text-zinc-700 md:hidden dark:border-white/[.1] dark:text-zinc-200"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4h12M2 8h12M2 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {title}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-black/[.06] bg-white p-4 shadow-xl dark:border-white/[.08] dark:bg-zinc-950">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <SidebarNav
              title={title}
              items={items}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

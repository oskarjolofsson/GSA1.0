import Image from "next/image";
import TopTabs from "./_components/top-tabs";
import SignOutButton from "@/features/auth/components/sign-out-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-black/[.06] bg-white/80 backdrop-blur dark:border-white/[.08] dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Image
            src="/true_swing_logo3.png"
            alt="TrueSwing"
            width={160}
            height={48}
            priority
            className="h-10 w-auto invert dark:invert-0"
          />
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              TrueSwing Admin
            </span>
          </div>
          {/* Right-side actions: nav tabs + sign out */}
          <div className="flex items-center gap-3">
            <TopTabs />
            <SignOutButton />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

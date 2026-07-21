import Link from "next/link";

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto mb-8 w-full max-w-3xl px-6">
        <Link
          href="/"
          className="font-sans text-sm text-sand-dim underline-offset-4 hover:text-sand hover:underline"
        >
          ← TrueSwing
        </Link>
      </div>
      {children}
    </div>
  );
}

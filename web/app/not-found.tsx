import Link from "next/link";

/** Emitted as out/404.html. Caddy serves it via `handle_errors`. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-5xl font-bold tracking-tight text-sand">
        Not found
      </h1>
      <p className="mt-4 text-sand-dim">
        That page doesn&apos;t exist. It may have moved when we rebuilt the site.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-gold px-6 py-3 font-sans font-semibold text-ink transition-colors hover:bg-gold-deep"
      >
        Back to TrueSwing
      </Link>
    </main>
  );
}

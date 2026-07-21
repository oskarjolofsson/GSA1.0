/**
 * The single place this site injects JSON-LD. One component so the
 * dangerouslySetInnerHTML call is auditable in exactly one file.
 *
 * Schema objects come from lib/seo/jsonLd.ts, which builds them from content/
 * data — so what a crawler reads and what a visitor reads cannot diverge.
 */
export function JsonLd({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      // Schema is built from local typed data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Presentational only, mirroring the prop shape of the legacy
 * frontend/src/features/legal/components/legalSection.jsx.
 *
 * The prop shape is kept deliberately identical so porting the legal copy is a
 * near 1:1 transcription rather than a restructure. Exact wording carries legal
 * weight on the one URL Apple verifies, and every structural change is another
 * chance to silently drop a clause.
 *
 * `whitespace-pre-line` is retained because the source strings are multi-line
 * template literals whose line breaks are meaningful.
 */
export function LegalSection({
  header,
  subheader,
  text,
  points,
}: {
  header?: string;
  subheader?: string;
  text?: string;
  points?: readonly string[];
}) {
  return (
    <section className="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-sand/20 bg-ink-raised/60 px-6 py-8 backdrop-blur-md sm:px-8">
      {header ? (
        <h1 className="font-display text-3xl font-bold text-sand sm:text-4xl">
          {header}
        </h1>
      ) : null}

      {subheader ? (
        <h2
          className={`font-display text-xl font-semibold text-gold ${
            header ? "mt-3" : ""
          }`}
        >
          {subheader}
        </h2>
      ) : null}

      {text ? (
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-sand-dim">
          {text}
        </p>
      ) : null}

      {points?.length ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-sand-dim">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

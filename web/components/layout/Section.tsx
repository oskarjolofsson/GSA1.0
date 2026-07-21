/**
 * Consistent vertical rhythm and max width for every landing section, so
 * spacing is decided once rather than re-guessed per component.
 */
export function Section({
  id,
  heading,
  children,
  className = "",
}: {
  id: string;
  heading?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = heading ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-5xl px-6 py-20 sm:py-28 ${className}`}
    >
      {heading ? (
        <h2
          id={headingId}
          className="font-display text-3xl font-bold tracking-tight text-balance text-sand sm:text-4xl"
        >
          {heading}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

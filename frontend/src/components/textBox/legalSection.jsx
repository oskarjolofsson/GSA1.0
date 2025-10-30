

export default function LegalContentSection({
  header,
  subheader,
  text,
  points,
}) {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-10 mb-12">
      <div className="rounded-3xl backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
        {header && (
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {header}
          </h1>
        )}

        {subheader && (
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-200 mb-3">
            {subheader}
          </h2>
        )}

        {text && (
          <p className="text-slate-300 leading-relaxed whitespace-pre-line mb-4">
            {text}
          </p>
        )}

        {points && points.length > 0 && (
          <ul className="list-disc list-inside text-slate-300 space-y-2 pl-2">
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}



export default function TextBox({ header, text, ctaOnClick, ctaText }) {
  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
      <div
        className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
      >
        {header && (
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {header}
          </h1>
        )}

        {text && (
          <h2 className="text-slate-300 leading-relaxed">
            {text}
          </h2>
        )}

        {ctaOnClick && ctaText && (
          <div className="mt-6">
            <button
              onClick={ctaOnClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200"
            >
              {ctaText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

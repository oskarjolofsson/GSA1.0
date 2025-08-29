export default function InfoBox({ title, text, image }) {
  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 my-12">
      <div
        className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
      >
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {title}
          </h2>
        )}

        {text && (
          <p className="text-slate-300 mb-4 leading-relaxed">
            {text}
          </p>
        )}

        {image && (
          <div className="mt-4">
            <img
              src={image}
              alt={title || "Info image"}
              className="rounded-2xl border border-white/10 max-h-80 w-auto object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}

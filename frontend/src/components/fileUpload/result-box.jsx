export default function InfoBox({ title, summary, drills = [], observations = [], phase_notes = {}, image }) {
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

        {summary && (
          <p className="text-slate-300 mb-6 leading-relaxed">
            {summary}
          </p>
        )}

        {Array.isArray(drills) && drills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Drills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {drills.map((item, idx) => (
                <div key={idx} className="col-span-1 bg-white/5 rounded-2xl border border-white/10 p-4">
                  <p className="text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* {Array.isArray(observations) && observations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Observations</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {observations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )} */}

        {phase_notes && typeof phase_notes === 'object' && Object.keys(phase_notes).length > 0 && (
          <div className="mb-2">
            <h3 className="text-xl font-semibold text-white mb-2">Phase Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['setup', 'backswing', 'transition', 'impact', 'finish'].map((key) => (
                phase_notes[key] ? (
                  <div key={key} className="col-span-1 bg-white/5 rounded-2xl border border-white/10 p-4">
                    <h4 className="text-lg font-semibold capitalize text-white mb-2">{key}</h4>
                    {Array.isArray(phase_notes[key]) ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {phase_notes[key].map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-300">{String(phase_notes[key])}</p>
                    )}
                  </div>
                ) : null
              ))}
            </div>
          </div>
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

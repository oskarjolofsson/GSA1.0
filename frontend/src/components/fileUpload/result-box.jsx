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
              {drills.map((drill, idx) => {
                const isObj = drill && typeof drill === 'object';
                const drillTitle = isObj
                  ? (drill['drill-title'] ?? drill.title ?? `Drill ${idx + 1}`)
                  : `Drill ${idx + 1}`;
                const drillDescription = isObj
                  ? (drill['drill-description'] ?? drill.description ?? '')
                  : String(drill);

                return (
                  <div key={idx} className="col-span-1 bg-white/5 rounded-2xl border border-white/10 p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{drillTitle}</h4>
                    {drillDescription && <p className="text-slate-300">{drillDescription}</p>}
                  </div>
                );
                })}
              </div>
              </div>
            )}

            {observations && typeof observations === 'object' && !Array.isArray(observations) && Object.keys(observations).length > 0 && (
              <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Observations</h3>
              <div className="flex flex-col gap-4">
                {Object.entries(observations).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-2xl border border-white/10 p-4">

                  <p className="text-slate-300">{String(value)}</p>
                </div>
                ))}
              </div>
              </div>
            )}
      </div>
    </section>
  );
}

function backgroundTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        backgroundImage: "url('/icons/topography.svg')",
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
        backgroundSize: '1200px',
      }}
    />
  )
}

function BottomVignette() {
  return (
    <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-120px_180px_-60px_rgba(0,0,0,0.6)]" />
  )
}


function heroWrapper() {
  return (
    <section className="relative mt-[10vh]">
      {/* Outer card */}
      <div className="relative rounded-3xl bg-[#0e1428] p-6 sm:p-12 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] border border-white/5">
        {/* Glass inner */}
        <div className="rounded-3xl bg-[#0e1428]/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-12 sm:px-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* LEFT: catchy header + steps box + subtext */}
            {leftBox()}

            {/* RIGHT: Try it out panel */}
            {rightBox()}
          </div>
        </div>
      </div>
    </section>
  );
}

function leftBox() {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight mb-6">
        Level up your performance
      </h1>

      {/* Steps box */}
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-500/40 dark:border-white/10 bg-[#0e1428]/70 dark:bg-slate-800/70 p-4 mb-6">
        <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
        <p className="text-lg font-semibold text-slate-100">
          Upload → Analyse → Improve
        </p>
      </div>

      <p className="text-slate-300 max-w-md">
        Get results in under 2 minutes. Quick insights designed for athletes and coaches.
      </p>
    </div>
  );
}


function rightBox() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-500/40 dark:border-white/10 bg-[#0e1428]/70 dark:bg-slate-800/70 p-6 w-full max-w-sm mx-auto md:mx-0">
      <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-4">
        Try it out
      </h2>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-5 py-3 bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => window.location.href = '/dashboard/upload'}
        >
          <img src="./icons/land-plot.svg" />
          Golf
        </button>
        {/* Pplace more buttons later */}
        
      </div>
    </div>
  )
}




export default function Hero() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100 flex items-start justify-center relative overflow-hidden">
      {/* subtle topo texture and vignette */}
      {backgroundTexture()}
      {BottomVignette()}
      <main className="mx-auto w-full max-w-6xl px-4">
        {heroWrapper()}
      </main>
    </div>
  );
}

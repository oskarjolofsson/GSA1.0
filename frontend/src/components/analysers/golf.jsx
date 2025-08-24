import Upload from "../fileUpload/VideoUploader.jsx";

export default function Golf() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100 flex items-start justify-center">
      <main className="mx-auto max-w-5xl px-4 w-full">
        <section className="relative mt-[5vh]">
          <div
            className="relative p-8 rounded-3xl bg-[#0e1428] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            style={{
              backgroundImage: "url('/icons/topography.svg')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top left"
            }}
          >
            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-white/10 p-6 sm:p-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">Upload Your Swing Video</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Tips for uploading</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6">
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5 p-8 text-center text-slate-500 dark:text-slate-400">
                  <Upload />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Secure & private — files never shared</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


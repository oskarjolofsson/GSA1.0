export default function CenteredPanel({ title, children, footer }) {
  return (
    <div className="w-full max-w-md rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-8 text-center">
      
      {title && (
        <h1 className="text-2xl font-semibold text-white mb-6">
          {title}
        </h1>
      )}

      <div className="text-slate-200">
        {children}
      </div>

      {footer && (
        <div className="mt-6 text-sm text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}

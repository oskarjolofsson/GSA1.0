

export default function GeneralTab({ user }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Details</h3>
      <div className="grid grid-cols-1 gap-4 text-sm text-slate-300">
        <div>
          <label className="block text-slate-400 mb-1">Organization name</label>
          <input className="w-full rounded-md bg-slate-900/40 border border-slate-800 px-3 py-2 text-slate-100" defaultValue={user?.displayName || 'Personal'} />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Organization ID</label>
          <div className="w-full rounded-md bg-slate-900/30 border border-slate-800 px-3 py-2 text-slate-300">org-•••••••••••••••</div>
        </div>

        <div className="mt-2">
          <label className="block text-slate-400 mb-1">Verifications</label>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-green-600 text-green-400 bg-green-900/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span>Organization Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
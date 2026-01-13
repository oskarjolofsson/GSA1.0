import CenteredPanel from "../components/dashboard/CenteredPanel";

export default function Dashboard() {
  return (
    <CenteredPanel
      title="Upload a new video"
      footer="or select a folder"
    >
      <button
        className="
          mx-auto flex items-center justify-center
          h-16 w-16 rounded-full
          bg-emerald-500/90 hover:bg-emerald-500
          text-white text-3xl font-semibold
          shadow-lg shadow-emerald-900/30
          transition
        "
      >
        +
      </button>

      <p className="mt-4 font-medium text-slate-300">
        Pick files
      </p>
    </CenteredPanel>
  );
}

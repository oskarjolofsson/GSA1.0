import GlassCard from "./GlassCard";


export default function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
}) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/75">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}
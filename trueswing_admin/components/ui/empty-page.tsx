/** Shared placeholder page body — replace with real content per feature. */
export default function EmptyPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-700">
        Empty — fill this in later.
      </div>
    </div>
  );
}

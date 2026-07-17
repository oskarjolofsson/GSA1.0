import TechnicalSidebar from "./_components/technical-sidebar";

export default function TechnicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full flex-1 px-6 py-8">
      <div className="flex gap-6">
        <TechnicalSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

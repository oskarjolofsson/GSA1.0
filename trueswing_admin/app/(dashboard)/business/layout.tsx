import BusinessSidebar from "./_components/business-sidebar";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full flex-1 px-6 py-8">
      <div className="flex gap-6">
        <BusinessSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

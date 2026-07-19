import Sidebar from "@/components/ui/sidebar";

const TECHNICAL_ITEMS = [{ href: "/technical/users", label: "Users" }];

export default function TechnicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full flex-1 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <Sidebar title="Technical" items={TECHNICAL_ITEMS} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

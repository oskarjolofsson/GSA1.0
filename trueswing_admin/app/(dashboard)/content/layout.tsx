import Sidebar from "@/components/ui/sidebar";

const CONTENT_ITEMS = [
  { href: "/content/issues", label: "Issues" },
  { href: "/content/drills", label: "Drills" },
  { href: "/content/coverage", label: "Coverage" },
];

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full flex-1 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <Sidebar title="Content" items={CONTENT_ITEMS} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

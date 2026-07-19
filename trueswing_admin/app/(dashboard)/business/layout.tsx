import Sidebar from "@/components/ui/sidebar";

const BUSINESS_ITEMS = [
  { href: "/business/subscriptions", label: "Subscriptions" },
];

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full flex-1 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <Sidebar title="Business" items={BUSINESS_ITEMS} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

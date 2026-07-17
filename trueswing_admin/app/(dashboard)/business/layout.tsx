export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
  );
}

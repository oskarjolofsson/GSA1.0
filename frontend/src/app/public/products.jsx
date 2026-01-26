import PriceTable from "../../components/subscriptions/PricingTable";

export default function Products() {
    return (
        <section className="relative py-16 sm:py-24 md:py-32 text-slate-100">
            <main className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 text-emerald-400/90 text-sm ring-1 ring-emerald-400/20 rounded-full px-3 py-1 bg-emerald-400/5">
                        Products
                    </span>
                    <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white tracking-tight">
                        Start analyzing smarter — no hidden limits
                    </h2>
                </div>
                <PriceTable />
            </main>
        </section>
    );
}
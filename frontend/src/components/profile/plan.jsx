import { useAuth } from '../../auth/authContext';
import PriceTable from '../subscriptions/PricingTable.jsx';
import { TrendingDown } from 'lucide-react';



export default function SubscriptionPlan() {
    const { user, loading } = useAuth();

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div className="max-w-xl rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mx-auto">
                <h2 className="text-lg font-semibold text-white">Subscription plan</h2>
                <PriceTable />

                {/* Cancel subscription button */}
                {/* {user?.isSubscribed && !loading && ( */}
                {user && !loading && (
                    <div className="flex select-none justify-center">
                        <a
                            onClick={() => alert('Cancel subscription')}
                            className="flex items-center text-red-400 hover:text-red-500 cursor-pointer transition-colors duration-200"
                        >
                            <TrendingDown className="h-5 w-5 mr-2" /><span className="font-medium">Cancel Subscription</span>
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DrillDropdown from "../components/drillDropdown/drillDropdown";
import PastDrillService from "../services/pastDrillService";
import SubscriptionService from "../services/activeSubscription";

export default function PastDrills() {

    
    const [drills, setDrills] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [isSubscribed, setIsSubscribed] = useState(null);
    // const [currentPlan, setCurrentPlan] = useState(null);
    // const navigate = useNavigate();

    // // Price ID constants
    // const playerMonthlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_MONTHLY;
    // const playerYearlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_YEARLY;

    // const getPlanName = (priceId) => {
    //     if (priceId === playerMonthlyPriceId || priceId === playerYearlyPriceId) {
    //         return "player";
    //     }
    //     return "pro";
    // };

    useEffect(() => {
        const fetchDrills = async () => {
            setLoading(true);
            const fetchedDrills = await PastDrillService.getPastAnalyses();
            setDrills(fetchedDrills);
            setLoading(false);
        };

        // const checkSubscription = async () => {
        //     try {
        //         const hasSubscription = await SubscriptionService.getActiveSubscription();
        //         setIsSubscribed(hasSubscription);
                
        //         if (hasSubscription) {
        //             const priceId = await SubscriptionService.getActivePriceId();
        //             setCurrentPlan(getPlanName(priceId));
        //             console.log("Current plan:", getPlanName(priceId));
        //         }
        //     } catch (error) {
        //         console.error('Failed to check subscription:', error);
        //         setIsSubscribed(false);
        //     } finally {
        //         setLoading(false);
        //     }
        // };

        // checkSubscription();
        fetchDrills();
    }, []);

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div
                className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            >
                <h1 className="text-2xl font-bold text-white mb-6">Past Analyses</h1>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-white/70 mt-4">Loading...</p>
                    </div>
                // ) : !isSubscribed ? (
                //     <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-6 mb-6 text-center">
                //         <p className="text-yellow-100 mb-4">
                //             You are not subscribed. Subscribe to view past analyses.
                //         </p>
                //         <button
                //             onClick={() => navigate('/products')}
                //             className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                //         >
                //             View Plans
                //         </button>
                //     </div>
                ) : drills.length === 0 ? (
                    <p className="text-white/70">No past drills found.</p>
                ) : (
                    // <>
                    //     <div className="space-y-4">
                    //         {drills.map((d) => (
                    //             <DrillDropdown
                    //                 key={d.id}
                    //                 header={d.quick_summary?.diagnosis || d['title'] || "Analysis"}
                    //                 date={d.createdAt}
                    //                 text={d.quick_summary?.key_fix || d.content || "No details available."}
                    //                 analysis={d}
                    //             />
                    //         ))}
                    //     </div>
                        
                    //     {currentPlan === "player" && drills.length >= 5 && (
                    //         <div className="mt-6 text-center">
                    //             <button
                    //                 onClick={() => navigate('/products')}
                    //                 className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                    //             >
                    //                 To see more drills, upgrade to <span className="font-bold">Pro</span>
                    //             </button>
                    //         </div>
                    //     )}
                    // </>

                    <>
                        <div className="space-y-4">
                             {drills.map((d) => (
                                <>
                                 <DrillDropdown
                                     key={d.id}
                                     header={d.quick_summary?.diagnosis || d['title'] || "Analysis"}
                                     date={d.createdAt}
                                     text={d.quick_summary?.key_fix || d.content || "No details available."}
                                     analysis={d}
                                 />
                                {/* // Seperator */}
                                <div className="border-b border-white/50 my-4"></div>
                                </>
                                

                             ))}
                         </div> 
                    </>
                )}
            </div>
        </section>
    );
}
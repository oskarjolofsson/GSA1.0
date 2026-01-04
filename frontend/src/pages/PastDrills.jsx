
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DrillDropdown from "../components/drillDropdown/drillDropdown";
import PastDrillService from "../services/pastDrillService";
import SubscriptionService from "../services/activeSubscription";

export default function PastDrills() {

    
    const [drills, setDrills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalDrills, setTotalDrills] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const ITEMS_PER_PAGE = 10;
    const currentOffset = parseInt(searchParams.get("offset") || "0", 10);
    const currentPage = Math.floor(currentOffset / ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalDrills / ITEMS_PER_PAGE);

    useEffect(() => {
        const fetchDrills = async () => {
            setLoading(true);
            try {
                const result = await PastDrillService.getPastAnalyses(currentOffset, ITEMS_PER_PAGE);
                setDrills(result.analyses);
                setTotalDrills(result.total);
            } catch (error) {
                console.error("Error fetching drills:", error);
                setDrills([]);
                setTotalDrills(0);
            } finally {
                setLoading(false);
            }
        };

        fetchDrills();
    }, [currentOffset]);

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            const newOffset = (currentPage - 1) * ITEMS_PER_PAGE;
            setSearchParams({ offset: newOffset.toString() });
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            const newOffset = (currentPage + 1) * ITEMS_PER_PAGE;
            setSearchParams({ offset: newOffset.toString() });
        }
    };

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
                ) : drills.length === 0 && totalDrills === 0 ? (
                    <p className="text-white/70">No past drills found.</p>
                ) : (
                    <>
                        <div className="space-y-4">
                             {drills.map((d) => (
                                <div key={d.id}>
                                 <DrillDropdown
                                     header={d.quick_summary?.diagnosis || d['title'] || "Analysis"}
                                     date={d.createdAt}
                                     text={d.quick_summary?.key_fix || d.content || "No details available."}
                                     analysis={d}
                                 />
                                {/* Separator */}
                                <div className="border-b border-white/50 my-4"></div>
                                </div>
                             ))}
                         </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                        currentPage === 0
                                            ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    Previous
                                </button>

                                <div className="text-white/70 text-center">
                                    <p className="font-semibold text-white">
                                        Page {currentPage + 1} of {totalPages}
                                    </p>
                                    <p className="text-sm mt-1">
                                        Showing {currentOffset + 1} - {Math.min(currentOffset + ITEMS_PER_PAGE, totalDrills)} of {totalDrills}
                                    </p>
                                </div>

                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages - 1}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                        currentPage >= totalPages - 1
                                            ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
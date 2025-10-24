
import React, { useEffect, useState } from "react";
import DrillDropdown from "../components/drillDropdown/drillDropdown";
import PastDrillService from "../services/pastDrillService";

export default function PastDrills() {

    const [drills, setDrills] = useState([]);

    useEffect(() => {
        const fetchDrills = async () => {
            const fetchedDrills = await PastDrillService.getPastDrills();
            setDrills(fetchedDrills);
        };

        fetchDrills();
    }, []);

    return (
        <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
            <div
                className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            >
                <h1 className="text-2xl font-bold text-white mb-6">Past Drills</h1>

                {drills.length === 0 ? (
                    <p className="text-white/70">No past drills found.</p>
                ) : (

                <div className="space-y-4">
                    {drills.map((d) => (
                        <DrillDropdown
                            key={d.id}
                            header={d.createdAt}
                            text={d.content}
                        />
                    ))}
                </div>
                )}
            </div>
        </section>
    );
}
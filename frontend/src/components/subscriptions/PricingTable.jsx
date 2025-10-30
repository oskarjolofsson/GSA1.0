import { useState } from "react";
import PlanCard from "./PlanCard";

export default function PriceTable() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div className="mt-4 mb-4 mx-auto max-w-6xl  py-12 rounded-lg" id="pricing">
      {/* Billing cycle buttons */}
      <div className="flex justify-center items-center gap-2 mb-8">
        <div className="inline-flex rounded-lg bg-white/10 p-1 backdrop-blur-sm">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
              billingCycle === "yearly"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            Yearly
            <span className="ml-1.5 text-xs text-green-400">Save 60€</span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 justify-items-center max-w-3xl mx-auto">
        <PlanCard
          id="player"
          name="Player"
          description="For players who need more features."
          monthlyPrice={7}
          yearlyPrice={70}
          features={["10 new tokens every month", "Save videos", "Prompt responses"]}
          currency="EUR"
          cycle={billingCycle}
          popular={true}
          isCurrent={true}
          onSelect={(id, cycle) => alert(`Selected ${id} (${cycle})`)}
        />

        <PlanCard
          id="pro"
          name="Pro"
          description="For professionals with many clients."
          monthlyPrice={15}
          yearlyPrice={10}
          features={["50 new tokens every month", "Save videos", "Prompt responses", "Organize clients", "Priority support"]}
          currency="EUR"
          cycle={billingCycle}
          popular={false}
          isCurrent={false}
          onSelect={(id, cycle) => alert(`Selected ${id} (${cycle})`)}
        />
      </div>
    </div>
  );
}
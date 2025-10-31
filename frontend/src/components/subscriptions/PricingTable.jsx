import { useState } from "react";
import PlanCard from "./PlanCard";
import { getAuth } from "firebase/auth";
import SignInPopup from "../signInPopup/signInPopup";
import { useAuth } from "../../auth/authContext";

async function createCheckoutSession(priceId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  // Get Firebase ID token to send to your Flask backend
  const token = await user.getIdToken();

  const res = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // backend verifies this
    },
    body: JSON.stringify({ priceId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const data = await res.json();
  window.location.href = data.url; // redirect to Stripe Checkout
}

export default function PriceTable() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showPopup, setShowPopup] = useState(false);
  const { user, login } = useAuth();

  const handlePlanSelect = async (priceIdMonthly, priceIdYearly) => {
    const priceId = billingCycle === "monthly" ? priceIdMonthly : priceIdYearly;
    if (user) {
      try {
        await createCheckoutSession(priceId);
      } catch (e) {
        // Surface minimal feedback; detailed errors are in console
        console.error(e);
        alert("Could not start checkout. Please try again.");
      }
    } else {
      setShowPopup(true);
    }
  };

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
          yearlyPrice={5}
          features={["10 new tokens every month", "Save videos", "Prompt responses"]}
          currency="EUR"
          cycle={billingCycle}
          popular={true}
          isCurrent={true}
          onSelect={() =>
            handlePlanSelect(
              "price_1SO1QwLTYv4hoLQi2JrfexqN",
              "price_1SO1QwLTYv4hoLQiBshbUAUV"
            )
          }
          price_id_monthly={"price_1SO1QwLTYv4hoLQi2JrfexqN"}
          price_id_yearly={"price_1SO1QwLTYv4hoLQiBshbUAUV"}
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
          onSelect={() =>
            handlePlanSelect(
              "price_1SO1V1LTYv4hoLQihQYZtd1Y",
              "price_1SO1V1LTYv4hoLQiUQl93mv4"
            )
          }
          price_id_monthly={"price_1SO1V1LTYv4hoLQihQYZtd1Y"}
          price_id_yearly={"price_1SO1V1LTYv4hoLQiUQl93mv4"}
        />
      </div>

      {showPopup && !user && (
        <SignInPopup onStartSignIn={login} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}

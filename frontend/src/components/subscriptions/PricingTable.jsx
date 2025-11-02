import { useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import { getAuth } from "firebase/auth";
import SignInPopup from "../signInPopup/signInPopup";
import { useAuth } from "../../auth/authContext";
import MessagePopup from "../popup/MessagePopup";

const URL = import.meta.env.VITE_API_URL;

async function createCheckoutSession(priceId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  // Get Firebase ID token to send to your Flask backend
  const token = await user.getIdToken();

  const res = await fetch(`${URL}/stripe/create-checkout-session`, {
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

async function switchSubscription(newPriceId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const token = await user.getIdToken();
  const res = await fetch(`${URL}/stripe/switch-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPriceId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}

export default function PriceTable() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const [activePriceId, setActivePriceId] = useState(null);

  // const playerMonthlyPriceId = "price_1SO1QwLTYv4hoLQi2JrfexqN";
  const playerYearlyPriceId = "price_1SO1QwLTYv4hoLQiBshbUAUV";
  // const proMonthlyPriceId = "price_1SO1V1LTYv4hoLQihQYZtd1Y";
  const proYearlyPriceId = "price_1SO1V1LTYv4hoLQiUQl93mv4";

  // Test price ids
  const playerMonthlyPriceId = "price_1SOya1LTYv4hoLQivA9NcNOl";
  const proMonthlyPriceId = "price_1SOyaOLTYv4hoLQiJptaAZlV";

  // Fetch the user's current active Stripe price_id from backend
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        if (!user) {
          setActivePriceId(null);
          return;
        }
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const res = await fetch(`${URL}/stripe/subscription-status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) {
          setActivePriceId(data?.price_id || null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch subscription status:", err);
        if (!cancelled) setActivePriceId(null);
      }
    }
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handlePlanSelect = async (priceIdMonthly, priceIdYearly) => {
    const priceId = billingCycle === "monthly" ? priceIdMonthly : priceIdYearly;
    if (user) {
      // Show confirmation message before proceeding
      setMessage("Proceeding with subscription update. Click OK to confirm. \n You’ll be charged a prorated amount for the rest of your current billing period");
      setPendingAction({
        priceId,
        priceIdMonthly,
        priceIdYearly,
      });
    } else {
      setShowPopup(true);
    }
  };

  const handleMessageConfirm = async () => {
    if (!pendingAction) {
      setMessage(null);
      return;
    }

    const { priceId } = pendingAction;
    setIsLoading(true);
    try {
      // If user already has an active subscription, switch instead of creating a new checkout session
      if (activePriceId) {
        if (activePriceId === priceId) {
          setMessage("You're already on this plan.");
          setPendingAction(null);
          setIsLoading(false);
          return;
        }
        await switchSubscription(priceId);
        // Optimistically update local state; backend will confirm on next status fetch
        setActivePriceId(priceId);
        setMessage("Subscription updated successfully.");
        setPendingAction(null);
        setIsLoading(false);
      } else {
        await createCheckoutSession(priceId);
        // Note: createCheckoutSession redirects to Stripe, so we won't reach here
      }
    } catch (e) {
      // Surface minimal feedback; detailed errors are in console
      console.error(e);
      setMessage("Could not start checkout. Please try again.");
      setPendingAction(null);
      setIsLoading(false);
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
          isCurrentPlan={
            !!activePriceId && (
              activePriceId === playerMonthlyPriceId ||
              activePriceId === playerYearlyPriceId
            )
          }
          isActiveCycle={
            activePriceId === (billingCycle === "monthly"
              ? playerMonthlyPriceId
              : playerYearlyPriceId)
          }
          hasSubscription={!!activePriceId}
          isLoading={isLoading}
          onSelect={() =>
            handlePlanSelect(
              playerMonthlyPriceId,
              playerYearlyPriceId
            )
          }
          price_id_monthly={playerMonthlyPriceId}
          price_id_yearly={playerYearlyPriceId}
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
          isCurrentPlan={
            !!activePriceId && (
              activePriceId === proMonthlyPriceId ||
              activePriceId === proYearlyPriceId
            )
          }
          isActiveCycle={
            activePriceId === (billingCycle === "monthly"
              ? proMonthlyPriceId
              : proYearlyPriceId)
          }
          hasSubscription={!!activePriceId}
          isLoading={isLoading}
          onSelect={() =>
            handlePlanSelect(
              proMonthlyPriceId,
              proYearlyPriceId
            )
          }
          price_id_monthly={proMonthlyPriceId}
          price_id_yearly={proYearlyPriceId}
        />
      </div>

      {showPopup && !user && (
        <SignInPopup onStartSignIn={login} onClose={() => setShowPopup(false)} />
      )}

      {message && (
        <MessagePopup
          message={message}
          onClose={() => {
            setMessage(null);
            setPendingAction(null);
          }}
          onConfirm={handleMessageConfirm}
        />
      )}
    </div>
  );
}

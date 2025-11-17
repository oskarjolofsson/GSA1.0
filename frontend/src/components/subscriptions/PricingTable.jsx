import { useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import SignInPopup from "../signInPopup/signInPopup";
import { useAuth } from "../../auth/authContext";
import MessagePopup from "../popup/MessagePopup";
import SubscriptionService from "../../services/activeSubscription";

export default function PriceTable({ refreshTrigger = 0 }) {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const [activePriceId, setActivePriceId] = useState(null);

  const playerMonthlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_MONTHLY;
  const playerYearlyPriceId = import.meta.env.VITE_PRICE_ID_PLAYER_YEARLY;
  const proMonthlyPriceId = import.meta.env.VITE_PRICE_ID_PRO_MONTHLY;
  const proYearlyPriceId = import.meta.env.VITE_PRICE_ID_PRO_YEARLY;

  // Fetch the user's current active Stripe price_id from backend
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        if (!user) {
          setActivePriceId(null);
          return;
        }
        const priceId = await SubscriptionService.getActivePriceId();
        if (!cancelled) {
          setActivePriceId(priceId);
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
  }, [user, refreshTrigger]);

  const handlePlanSelect = async (priceIdMonthly, priceIdYearly) => {
    const priceId = billingCycle === "monthly" ? priceIdMonthly : priceIdYearly;
    if (user) {
      // Only show confirmation message if switching plans (not for new subscriptions)
      if (activePriceId) {
        const charge = await SubscriptionService.getUpcomingInvoicePrice(priceId);

        setMessage(`Confirm plan change. You will will be billed on your next renewal date. Continue?`);
        setPendingAction({
          priceId,
          priceIdMonthly,
          priceIdYearly,
        });
      } else {
        // For new subscriptions, go directly to checkout
        setPendingAction({
          priceId,
          priceIdMonthly,
          priceIdYearly,
        });
        setIsLoading(true);
        try {
          const checkoutUrl = await SubscriptionService.createCheckoutSession(priceId);
          window.location.href = checkoutUrl;
        } catch (e) {
          console.error(e);
          setMessage("Could not start checkout. Please try again.");
          setPendingAction(null);
          setIsLoading(false);
        }
      }
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
        await SubscriptionService.switchSubscription(priceId);
        // Optimistically update local state; backend will confirm on next status fetch
        setActivePriceId(priceId);
        setMessage("Subscription updated successfully.");
        setPendingAction(null);
        setIsLoading(false);
      } else {
        const checkoutUrl = await SubscriptionService.createCheckoutSession(priceId);
        window.location.href = checkoutUrl;
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
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${billingCycle === "monthly"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${billingCycle === "yearly"
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
          description="For the average player."
          monthlyPrice={7}
          yearlyPrice={5}
          features={[{ label: "Unlimited swing analyses", comingSoon: false }, 
                     { label: "Basic AI swing Breakdown", comingSoon: false }, 
                     { label: "Access to last 5 analyses", comingSoon: false },
                     { label: "Add prompt to video", comingSoon: false }, 
                     { label: "Downloaded basic reports", comingSoon: true }
                     ]}
          currency="EUR"
          cycle={billingCycle}
          popular={false}
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
          features={[{ label: "Unlimited swing analyses", comingSoon: false },
                     { label: "Advanced AI swing Breakdown", comingSoon: false },
                     { label: "Access to all past analyses", comingSoon: false },
                     { label: "Add prompt to video", comingSoon: false },
                     { label: "Download tailored reports", comingSoon: true },
                     { label: "Organize among clients", comingSoon: true },
                     { label: "Coach workspace", comingSoon: true }

          ]}
          currency="EUR"
          cycle={billingCycle}
          popular={true}
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
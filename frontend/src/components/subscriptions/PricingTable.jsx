import PlanCard from "./PlanCard";

export default function Demo() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center">
      <PlanCard
        id="free"
        name="Free"
        description="Free plan for personal use."
        monthlyPrice={0}
        yearlyPrice={0}
        features={["One new token every month", "Community support"]}
        currency="EUR"
        cycle="monthly"
        popular={false}
        isCurrent={false}
        onSelect={(id, cycle) => alert(`Selected ${id} (${cycle})`)}
      />

      <PlanCard
        id="player"
        name="Player"
        description="For players who need more features."
        monthlyPrice={7}
        yearlyPrice={70}
        features={["10 new tokens every month", "Save videos", "Prompt responses", "Email support"]}
        currency="EUR"
        cycle="monthly"
        popular={true}
        isCurrent={true}
        onSelect={(id, cycle) => alert(`Selected ${id} (${cycle})`)}
      />

      <PlanCard
        id="pro"
        name="Pro"
        description="For professionals with advanced needs or many clients."
        monthlyPrice={19}
        yearlyPrice={190}
        features={["Up to 10 projects", "Priority support", "Advanced analytics", "API access"]}
        currency="EUR"
        cycle="monthly"
        popular={false}
        isCurrent={false}
        onSelect={(id, cycle) => alert(`Selected ${id} (${cycle})`)}
      />
    </div>
  );
}
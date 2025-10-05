import { useAuth } from "../../auth/authContext";

function PriceCard({ plan, price, tokens, color, border, features, link, description }) {
  const { user } = useAuth();
  const cta = user ? "Switch plan" : "Buy Now";

  return (
    <a
      href={link}
      className={`flex flex-col justify-between w-full md:w-80 ${color} text-white rounded-2xl shadow-lg p-6 border ${border} transition-transform transform hover:scale-105 cursor-pointer group`}
    >
      <div>
        <h3 className="text-blue-300 font-semibold">{plan}</h3>
        <p className="text-4xl font-bold mt-2">${price}</p>
        <p className="text-slate-300 mb-2">{tokens}</p>

        <p className="text-slate-200 mb-4">{description}</p>
        <ul className="space-y-2 text-slate-100">
          {features.map((feature, index) => (
            <li key={index}>✔ {feature}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 w-full py-3 bg-blue-600 rounded-xl font-semibold text-center group-hover:bg-blue-700">
        {cta}
      </div>
    </a>
  );
}

export default function PriceBox() {
  const plans = [
    {
      plan: "Basic",
      price: 5,
      tokens: "15 Tokens",
      color: "bg-slate-800",
      border: "border-slate-700",
      description: "Perfect for trying things out.",
      link: "/checkout?plan=basic",
      features: ["Get 15 tokens instantly", "One-time purchase"],
    },
    {
      plan: "Standard",
      price: 10,
      tokens: "40 Tokens",
      color: "bg-slate-700",
      border: "border-slate-600",
      description: "Best value for regular use.",
      link: "/checkout?plan=standard",
      features: [
        "Get 40 tokens instantly",
        "One-time purchase",
        "Extra tokens at a better rate",
      ],
    },
    {
      plan: "Premium",
      price: 50,
      tokens: "1 Year Supply",
      color: "bg-slate-600",
      border: "border-slate-500",
      description: "For heavy users who want peace of mind.",
      link: "/checkout?plan=premium",
      features: [
        "Unlimited access for 1 year",
        "No need to buy tokens separately",
        "Best overall deal",
      ],
    },
  ];

  return (
    <div className="mt-12 flex flex-col md:flex-row justify-center items-stretch gap-6 py-10 px-6">
      {plans.map((plan) => (
        <PriceCard key={plan.plan} {...plan} />
      ))}
    </div>
  );
}

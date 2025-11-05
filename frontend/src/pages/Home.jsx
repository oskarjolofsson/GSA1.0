import Hero from '../components/home-page/Hero.jsx';
import Faq from '../components/home-page/faq.jsx';
import PricingTable from "../components/subscriptions/PricingTable.jsx";

import MarketingBox from "../components/home-page/Marketingbox.jsx";

import Hero2 from '../components/home-page/Hero2.jsx';

export default function Home() {

    // For debugging Firebase auth tokens
    // const auth = getAuth();
    // auth.onAuthStateChanged(async (user) => {
    // if (user) {
    //     const token = await user.getIdToken();
    //     console.log("Firebase ID token:", token);
    // } else {
    //     console.log("No user signed in");
    // }
    // });

    return (
        <div>
            <Hero2 />
            {/* Border between hero and the rest  */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <MarketingBox id="features" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <Faq id="faq" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="text-center mb-6 mt-16">
                <span className="inline-flex items-center gap-2 text-emerald-400/90 text-sm ring-1 ring-emerald-400/20 rounded-full px-3 py-1 bg-emerald-400/5">
                    Products
                </span>
                <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white tracking-tight">
                    Where every frame holds value
                </h2>
                <p className="mt-2 text-lg text-slate-400">
                    Transform your videos into measurable intelligence — instantly.
                </p>
            </div>

            <PricingTable />

        </div>
    );
}
import Hero from '../components/home-page/Hero.jsx';
import Faq from '../components/home-page/faq.jsx';
import PricingTable from "../components/subscriptions/PricingTable.jsx";

import MarketingBox from "../components/home-page/Marketingbox.jsx";

import { getAuth } from "firebase/auth";

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
            <Hero />
            {/* Border between hero and the rest  */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <MarketingBox id="features" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <Faq id="faq" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <PricingTable />
            
        </div>
    );
}
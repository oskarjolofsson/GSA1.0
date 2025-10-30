import Hero from '../components/home-page/Hero.jsx';
import Faq from '../components/home-page/faq.jsx';
import PricingTable from "../components/subscriptions/PricingTable.jsx";

import MarketingBox from "../components/home-page/Marketingbox.jsx";

export default function Home() {
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
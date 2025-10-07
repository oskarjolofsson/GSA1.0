import Hero from '../components/hero/Hero.jsx';
import Faq from '../components/faq/faq.jsx'

import MarketingBox from '../components/marketing/marketingbox.jsx';

export default function Home() {
    return (
        <div>
            <Hero />
            {/* Border between hero and the rest  */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <MarketingBox />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <Faq />
        </div>
    );
}
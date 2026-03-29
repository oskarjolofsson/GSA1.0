import Faq from '../components/faq.jsx';
import MarketingBox from "../components/Marketingbox.jsx";
import Hero2 from '../components/Hero2.jsx';
import { useSearchParams } from 'react-router-dom';
import SignInPopup from '@/shared/components/popup/signInPopup.jsx';
import HeroSection from '../components/Hero3';
import SolutionSection from '../components/SolutionSelection.js';

export default function LandingScreen() {
    const [searchParams, setSearchParams] = useSearchParams();
    const showSignIn = searchParams.get("auth") === "signin";

    return (
        <div>
            <HeroSection imageUrl='/media/pose2.jpg' />
            {/* Border between hero and the rest  */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <SolutionSection />
            
             {/* Border between solution and the rest  */}
             <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <MarketingBox id="features" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <Faq id="faq" />

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {showSignIn && (
                <SignInPopup onClose={() => setSearchParams({})} />
            )}
        </div>
    );
}


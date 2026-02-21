import Faq from '../components/faq.jsx';
import MarketingBox from "../components/Marketingbox.jsx";
import Hero2 from '../components/Hero2.jsx';
import { useSearchParams } from 'react-router-dom';
import SignInPopup from '@/shared/components/popup/signInPopup.jsx';

export default function LandingScreen() {
    const [searchParams, setSearchParams] = useSearchParams();
    const showSignIn = searchParams.get("auth") === "signin";

    return (
        <div>
            <Hero2 />
            {/* Border between hero and the rest  */}
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


import Hero from '../components/hero/hero.jsx';
import Faq from '../components/faq/faq.jsx'
import Status from '../components/status/status.jsx';

export default function Home() {
    return (
        <div>
            <Hero />
            <Faq />
            <Status />
        </div>
    );
}
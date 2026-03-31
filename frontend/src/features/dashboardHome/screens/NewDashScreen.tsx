

import RecentAnalyses from "../components/sections/RecentAnalyses";
import IssueProgress from "../components/sections/IssueProgress";
import Hero from "../components/sections/Hero";
import Header from "../components/sections/Header";


export default function PremiumGolfDashboard() {

  return (
    <div className="min-h-screen overflow-hidden  text-white">
      <div className="pointer-events-none absolute inset-0">
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Header />

          <Hero />

        <IssueProgress />

        <RecentAnalyses />
        
      </main>
    </div>
  );
}

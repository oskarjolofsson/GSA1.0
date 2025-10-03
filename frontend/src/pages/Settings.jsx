import React, { useState } from 'react';
import { useAuth } from "../auth/authContext.jsx";

// Import components for each tab
import GeneralTab from '../components/settings/general.jsx';
import BillingTab from '../components/settings/billing.jsx';

export default function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState('general');


  function sidebarTab({tab}) {
    return (
      <button
        onClick={() => setActive(tab.toLowerCase())}
        className={`w-full text-left py-3 px-4 rounded-l-md transition-colors ${active === tab.toLowerCase() ? 'bg-slate-900/40 border-l-4 border-green-500 text-slate-100' : 'hover:bg-slate-900/20 text-slate-300'}`}>
        {tab}
      </button>
    );
  }

  function sidebarTabs() {
    return (
      <aside className="w-72 p-6 border-r border-slate-800 bg-[#0b1020]">
        <h2 className="text-xl font-semibold mb-6">Organization settings</h2>
        <div className="flex flex-col space-y-2">
          
          {sidebarTab({tab: 'General'})}
          {sidebarTab({tab: 'Billing'})}
          {/* Add more tabs here as needed */}

        </div>
      </aside>
    );
  }

  return (
    <div className="min-h-screen py-5 px-8 text-slate-100 mt-20">
      <div className="max-w-6xl mx-auto bg-[#0b1020] rounded-md shadow-lg border border-slate-800 overflow-hidden">
        <div className="flex">
          {/* Sidebar (tabs) */}
          {sidebarTabs()}

          {/* Content area */}
          <section className="flex-1 p-6">
            {active === 'general' && <GeneralTab user={user} />}
            {active === 'billing' && <BillingTab />}
          </section>
        </div>
      </div>
    </div>
  );
}



import DrillDropdown from "../components/drillDropdown/drillDropdown";

export default function PastDrills() {
  return (

    <section className="relative w-full max-w-4xl mx-auto px-4 mt-[14vh] mb-12">
      <div
        className="rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Past Drills</h1>
       <DrillDropdown
         header="Drill 1"
         text="Details about Drill 1"
       />
       <DrillDropdown
         header="Drill 1"
         text="Details about Drill 1"
       />
       <DrillDropdown
         header="Drill 1"
         text="Details about Drill 1"
       />
       <DrillDropdown
         header="Drill 1"
         text="Details about Drill 1"
       />
      </div>
    </section>
  );
}
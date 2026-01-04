export default function AIdropdown({ options, selectedOption, onSelect }) {
  return (
    <div className="relative w-full">
      <select
        value={selectedOption}
        onChange={(e) => onSelect(e.target.value)}
        className="
          w-full
          appearance-none
          bg-[#0e1428]/70
          backdrop-blur-md
          border border-white/10
          text-white text-sm
          py-2 pl-4 pr-9
          rounded-xl
          focus:outline-none
          focus:ring-1 focus:ring-blue-500/60
          focus:border-blue-500/60
          transition
        "
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#0e1428] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom chevron */}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

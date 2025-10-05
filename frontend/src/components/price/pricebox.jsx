import React from "react";

export default function PriceBox() {
  return (
    <div className="mt-12 flex flex-col md:flex-row justify-center items-stretch gap-6 py-10 px-6">
      {/* 15 Tokens Plan - Darkest */}
      <a href="/checkout?plan=basic" className="flex flex-col justify-between w-full md:w-80 bg-slate-800 text-white rounded-2xl shadow-lg p-6 border border-slate-700 transition-transform transform hover:scale-105 cursor-pointer group">
        <div>
          <h3 className="text-blue-300 font-semibold">Basic</h3>
          <p className="text-4xl font-bold mt-2">$5</p>
          <p className="text-slate-300 mb-2">15 Tokens</p>

          <p className="text-slate-200 mb-4">Perfect for trying things out.</p>
          <ul className="space-y-2 text-slate-100">
            <li>✔ Get 15 tokens instantly</li>
            <li>✔ One-time purchase</li>
          </ul>
        </div>

        <div className="mt-6 w-full py-3 bg-blue-600 rounded-xl font-semibold text-center group-hover:bg-blue-700">
          Buy Now
      </div>
      </a>

      {/* 40 Tokens Plan - Medium Darkness */}
      <a href="/checkout?plan=standard" className="flex flex-col justify-between w-full md:w-80 bg-slate-700 text-white rounded-2xl shadow-xl p-6 border border-slate-600 transition-transform transform hover:scale-105 cursor-pointer group">
        <div>
          <h3 className="text-blue-300 font-semibold">Standard</h3>
          <p className="text-4xl font-bold mt-2">$10</p>
          <p className="text-slate-300 mb-2">40 Tokens</p>

          <p className="text-slate-200 mb-4">Best value for regular use.</p>
          <ul className="space-y-2 text-slate-100">
            <li>✔ Get 40 tokens instantly</li>
            <li>✔ One-time purchase</li>
            <li>✔ Extra tokens at a better rate</li>
          </ul>
        </div>

        <div className="mt-6 w-full py-3 bg-blue-600 rounded-xl font-semibold text-center group-hover:bg-blue-700">
          Buy Now
      </div>
      </a>

      {/* Year Supply Plan - Lightest */}
      <a href="/checkout?plan=premium" className="flex flex-col justify-between w-full md:w-80 bg-slate-600 text-white rounded-2xl shadow-md p-6 border border-slate-500 transition-transform transform hover:scale-105 cursor-pointer group">
        <div>
          <h3 className="text-blue-300 font-semibold">Premium</h3>
          <p className="text-4xl font-bold mt-2">$50</p>
          <p className="text-slate-300 mb-2">1 Year Supply</p>

          <p className="text-slate-200 mb-4">For heavy users who want peace of mind.</p>
          <ul className="space-y-2 text-slate-100">
            <li>✔ Unlimited access for 1 year</li>
            <li>✔ No need to buy tokens separately</li>
            <li>✔ Best overall deal</li>
          </ul>
        </div>

        <div className="mt-6 w-full py-3 bg-blue-600 rounded-xl font-semibold text-center group-hover:bg-blue-700">
          Buy Now
      </div>
      </a>
    </div>
  );
}


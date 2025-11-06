import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PricingTable from '../subscriptions/PricingTable';

export default function OutOfTokensPopup({ isOpen, onClose, refreshTrigger = 0 }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setExiting(false);
      requestAnimationFrame(() => setEntered(true));
    } else {
      setEntered(false);
      setExiting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClose() {
    setExiting(true);
    setEntered(false);
    const DURATION = 300;
    setTimeout(() => onClose && onClose(), DURATION);
  }

  function handleViewProducts() {
    handleClose();
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center" 
      aria-live="assertive"
      onClick={handleClose}
    >
      <div 
        className="pointer-events-auto w-full max-w-4xl pointer-events-auto px-4 max-h-[90vh] overflow-y-auto justify-center flex pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`rounded-2xl border-2 border-white bg-slate-900/95 text-white p-8 shadow-lg transform transition-all duration-300 ease-out
            ${entered && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-start justify-between mb-6 text-center">
            <div>
              <h2 className="text-2xl font-bold">You are out of tokens 🤦‍♂️</h2>
              <p className="mt-2 text-sm text-slate-300">
                Upgrade your plan to get UNLIMITED tokens and continue analyzing your drills.
              </p>
            </div>
          </div>

        {/* Button to view products */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                handleClose();
                navigate('/products');
              }}
              className="hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition border border-white"
            >
              View Our Products
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

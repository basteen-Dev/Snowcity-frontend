import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogIn, AlertTriangle } from 'lucide-react';
import { resetBookingFlow, setStep } from '../../features/bookings/bookingsSlice';
import { logout } from '../../features/auth/authSlice';

/**
 * Modal that appears when token expires during booking
 * Offers clean re-authentication without losing booking context
 */
export default function TokenExpiredModal({ isOpen, onClose, onSignIn }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-lg font-bold">Session Expired</h2>
          </div>
          <p className="mt-2 text-sm opacity-90">Your login session has expired. Please sign in again to continue booking.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6">
            Your booking information is saved. Sign in again to complete your purchase without losing your selections.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-95"
            >
              <LogIn className="h-5 w-5" />
              Sign In Again
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium transition-all hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

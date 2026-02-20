import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertCircle, RefreshCcw, Phone, Mail, ExternalLink } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentReturn() {
  const query = useQuery();
  const navigate = useNavigate();
  const [uiState, setUiState] = useState('processing'); // processing, success, failed
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Backend redirects here with these params after processing
  const orderRef = query.get('order') || query.get('booking') || 'Unknown';
  const status = query.get('status');

  useEffect(() => {
    if (status === 'success') {
      setUiState('success');
      // Clear any pending order data and booking session
      localStorage.removeItem('pendingOrderData');
      sessionStorage.removeItem('snowcity_booking_state');
    } else if (status === 'failed' || status === 'error') {
      setUiState('failed');
    } else if (status === 'pending') {
      setUiState('pending');
    } else {
      setUiState('processing');
    }
  }, [status]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (retryCount >= 2) {
      // After 2 retries, suggest contacting support
      setShowDetails(true);
    } else {
      // Navigate back to booking page — sessionStorage will restore the payment step with data
      navigate('/booking#step-4');
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Payment Issue - Order ${orderRef}`);
    const body = encodeURIComponent(`I'm experiencing payment issues with order ${orderRef}.\n\nStatus: ${status}\nRetry attempts: ${retryCount + 1}\n\nPlease assist me with completing this booking.`);
    window.location.href = `mailto:support@snowcity.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">

        {/* --- SUCCESS STATE --- */}
        {uiState === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Thank you for your purchase. Your order <span className="font-mono font-medium text-gray-800 bg-gray-100 px-1 rounded">#{orderRef}</span> has been processed successfully.
            </p>
          </>
        )}

        {/* --- FAILED STATE --- */}
        {uiState === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <XCircle size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6 text-sm">
              We couldn't complete your transaction for order <span className="font-mono font-medium text-gray-800 bg-gray-100 px-1 rounded">#{orderRef}</span>.
              {retryCount > 0 && <span className="text-red-600 font-medium">(Attempt {retryCount + 1})</span>}
            </p>

            {!showDetails ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-amber-600" size={20} />
                    <h4 className="font-semibold text-amber-800">Possible Reasons:</h4>
                  </div>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Insufficient funds or credit limit</li>
                    <li>• Incorrect card details or CVV</li>
                    <li>• Bank declined the transaction</li>
                    <li>• Network connectivity issues</li>
                    <li>• Payment gateway timeout</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <h4 className="font-semibold text-red-800">Multiple Failed Attempts</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  You've tried {retryCount + 1} times without success. For your security and to protect your account,
                  we recommend contacting our support team for assistance.
                </p>
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-gray-600" />
                    <span className="font-medium">Support: +91-XXXXXXXXXX</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-gray-600" />
                    <span className="font-medium">support@snowcity.com</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- PROCESSING / PENDING STATE --- */}
        {(uiState === 'processing' || uiState === 'pending') && (
          <>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {uiState === 'pending' ? <AlertCircle size={32} /> : <Loader size={32} className="animate-spin" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {uiState === 'pending' ? 'Payment Pending' : 'Verifying...'}
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              Please wait while we check the status of your order <span className="font-mono font-medium text-gray-800">#{orderRef}</span>.
            </p>
          </>
        )}

        {/* --- ACTIONS --- */}
        <div className="space-y-3">
          <Link
            to="/my-bookings"
            className="block w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            View Ticket & Orders
          </Link>

          {uiState === 'failed' && (
            <>
              {!showDetails && (
                <button
                  onClick={handleRetry}
                  className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={18} />
                  {retryCount > 0 ? `Try Again (${retryCount + 1}/3)` : 'Try Again'}
                </button>
              )}

              <button
                onClick={handleContactSupport}
                className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                Contact Support
              </button>
            </>
          )}

          <Link
            to="/"
            className="block w-full text-gray-400 font-medium py-2 text-sm hover:text-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
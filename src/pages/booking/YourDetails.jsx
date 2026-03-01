import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Globe, ChevronRight, RefreshCw } from 'lucide-react';
import OrderDetailsBox from './OrderDetailsBox';

/**
 * YourDetails Component (Step 3 of Booking)
 * 2-column layout: form on left, booking summary on right
 * Matches reference screenshot exactly
 */
export default function YourDetails({
    hasToken,
    contact,
    dispatch,
    setContact,
    contactErrors,
    setContactErrors,
    countryCode,
    setCountryCode,
    COUNTRY_CODES,
    phoneLocal,
    handlePhoneChange,
    otp,
    sendOTP,
    otpCode,
    setOtpCode,
    verifyOTP,
    handleBack,
    handleNext,
    cartItems = [],
    finalTotal = 0,
    totalAddonsCost = 0,
    hasCartItems = false,
    onEditCartItem,
    onRemoveCartItem,
    step,
    paymentLoading,
}) {
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownRef = useRef(null);

    useEffect(() => {
        if (otp.sent && resendCooldown === 0) {
            setResendCooldown(30);
        }
    }, [otp.sent]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (resendCooldown <= 0) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return;
        }
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(cooldownRef.current);
    }, [resendCooldown]);

    const handleResendOTP = () => {
        if (resendCooldown > 0 || otp.status === 'loading') return;
        setResendCooldown(30);
        sendOTP();
    };

    if (hasToken) return null;

    const ticketsTotal = cartItems.reduce(
        (acc, item) => acc + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mt-4">
            {/* LEFT: Form */}
            <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Details</h2>

                <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                    {/* Full Name */}
                    <div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-400 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                            value={contact.name}
                            onChange={(e) => dispatch(setContact({ name: e.target.value }))}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <input
                            placeholder="Email Address"
                            type="email"
                            className={`w-full border rounded-xl px-4 py-3.5 focus:ring-2 outline-none transition-all text-gray-900 placeholder:text-gray-400 ${contactErrors.email
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-200 focus:ring-sky-500 focus:border-sky-400'
                                }`}
                            value={contact.email}
                            onChange={(e) => {
                                dispatch(setContact({ email: e.target.value }));
                                if (contactErrors.email) setContactErrors((p) => ({ ...p, email: undefined }));
                            }}
                        />
                        {contactErrors.email && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {contactErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <div className="flex gap-3">
                            <div className="relative w-28">
                                <select
                                    className="w-full px-3 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none appearance-none font-medium text-sm"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                                <ChevronRight
                                    size={14}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
                                />
                            </div>
                            <input
                                placeholder="Mobile Number"
                                type="tel"
                                maxLength={10}
                                className={`flex-1 border rounded-xl px-4 py-3.5 focus:ring-2 outline-none transition-all text-gray-900 placeholder:text-gray-400 tracking-wide ${contactErrors.phone
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-gray-200 focus:ring-sky-500 focus:border-sky-400'
                                    }`}
                                value={phoneLocal}
                                onChange={handlePhoneChange}
                            />
                        </div>
                        {contactErrors.phone && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {contactErrors.phone}
                            </p>
                        )}
                    </div>

                    {/* WhatsApp Consent - pre-checked toggle style from screenshot */}
                    <div className="flex items-center justify-between py-3">
                        <p className="text-sm font-medium text-gray-900">Receive updates on WhatsApp</p>
                        <input
                            type="checkbox"
                            checked={contact.whatsapp_consent !== false}
                            onChange={(e) => dispatch(setContact({ whatsapp_consent: e.target.checked }))}
                            className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                        />
                    </div>
                </div>

                {/* OTP Error */}
                {otp.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 mt-4">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">
                            {otp.error?.message || otp.error || 'Something went wrong. Please try again.'}
                        </p>
                    </div>
                )}

                {/* OTP Flow */}
                {!otp.sent ? (
                    <button
                        onClick={sendOTP}
                        disabled={otp.status === 'loading'}
                        className="mt-6 w-full bg-sky-600 text-white py-3.5 rounded-xl font-bold text-base shadow-md hover:bg-sky-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {otp.status === 'loading' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-xl animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            'Verify Mobile'
                        )}
                    </button>
                ) : (
                    <div className="mt-6 bg-sky-50 border border-sky-100 p-5 rounded-2xl">
                        <p className="text-sm text-sky-800 mb-3 font-medium">
                            Enter OTP sent to {countryCode} {phoneLocal}
                        </p>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <input
                                placeholder="● ● ● ● ● ●"
                                className="flex-1 p-3.5 text-center tracking-[0.5em] font-bold text-xl border-2 border-sky-200 rounded-xl focus:border-sky-600 focus:ring-4 focus:ring-sky-100 outline-none bg-white transition-all"
                                maxLength={6}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                value={otpCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtpCode(val);
                                    if (val.length === 6 && /^\d{6}$/.test(val)) {
                                        setTimeout(() => { verifyOTP(val); }, 300);
                                    }
                                }}
                            />
                            <button
                                onClick={verifyOTP}
                                disabled={otp.status === 'loading' || otpCode.length < 6}
                                className="bg-sky-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-sky-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                {otp.status === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-xl animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : otp.verified ? (
                                    <>
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Verified
                                    </>
                                ) : 'Verify'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            OTP will auto-verify once all 6 digits are filled
                        </p>
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-sky-100">
                            <p className="text-xs text-gray-500">Didn't receive the OTP?</p>
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={resendCooldown > 0 || otp.status === 'loading'}
                                className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-all ${resendCooldown > 0 || otp.status === 'loading'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-sky-700 hover:text-sky-900 active:scale-95'
                                    }`}
                            >
                                <RefreshCw size={14} className={otp.status === 'loading' ? 'animate-spin' : ''} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : otp.status === 'loading' ? 'Sending...' : 'Resend OTP'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mt-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-8 py-3.5 border rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-semibold shadow-sm"
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* RIGHT: Booking Summary */}
            <OrderDetailsBox
                cartItems={cartItems}
                hasCartItems={hasCartItems}
                onEditCartItem={onEditCartItem}
                onRemoveCartItem={onRemoveCartItem}
                finalTotal={finalTotal}
                handleNext={handleNext}
                step={step}
                paymentLoading={paymentLoading}
            />
        </div>
    );
}

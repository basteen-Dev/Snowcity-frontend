import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, AlertCircle, Globe, ChevronRight, Phone, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * YourDetails Component (Step 3 of Booking)
 * - Handles name, email, phone input
 * - Send OTP / Resend OTP / Verify OTP flow
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
}) {
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownRef = useRef(null);

    // Start cooldown timer when OTP is sent
    useEffect(() => {
        if (otp.sent && resendCooldown === 0) {
            setResendCooldown(30);
        }
    }, [otp.sent]); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer
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

    return (
        <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300 mt-4">
            <div className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                    <div className="relative group">
                        <User
                            className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                            size={18}
                        />
                        <input
                            placeholder="John Doe"
                            className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all font-medium"
                            value={contact.name}
                            onChange={(e) => dispatch(setContact({ name: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail
                            className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                            size={18}
                        />
                        <input
                            placeholder="name@example.com"
                            type="email"
                            className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium ${contactErrors.email
                                ? 'border-red-300 focus:ring-red-200'
                                : 'border-gray-200 focus:ring-sky-500'
                                }`}
                            value={contact.email}
                            onChange={(e) => {
                                dispatch(setContact({ email: e.target.value }));
                                if (contactErrors.email) setContactErrors((p) => ({ ...p, email: undefined }));
                            }}
                        />
                    </div>
                    {contactErrors.email && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {contactErrors.email}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mobile Number</label>
                    <div className="flex gap-3">
                        <div className="relative w-32">
                            <div className="absolute left-3 top-3.5 z-10 pointer-events-none">
                                <Globe size={18} className="text-gray-400" />
                            </div>
                            <select
                                className="w-full pl-10 pr-8 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none appearance-none font-medium text-sm"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                            >
                                {COUNTRY_CODES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
                            />
                        </div>

                        <div className="relative flex-1 group">
                            <Phone
                                className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                                size={18}
                            />
                            <input
                                placeholder="98765 43210"
                                type="tel"
                                maxLength={10}
                                className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium tracking-wide ${contactErrors.phone
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-gray-200 focus:ring-sky-500'
                                    }`}
                                value={phoneLocal}
                                onChange={handlePhoneChange}
                            />
                        </div>
                    </div>
                    {contactErrors.phone && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {contactErrors.phone}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            required
                            checked={contact.whatsapp_consent || false}
                            onChange={(e) => dispatch(setContact({ whatsapp_consent: e.target.checked }))}
                            className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                            I agree to receive WhatsApp notifications *
                        </span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                        We'll send booking confirmations and updates via WhatsApp
                    </p>
                </div>

                {/* OTP Error Display */}
                {otp.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">
                            {otp.error?.message || otp.error || 'Something went wrong. Please try again.'}
                        </p>
                    </div>
                )}

                {!otp.sent ? (
                    <button
                        onClick={sendOTP}
                        disabled={otp.status === 'loading'}
                        className="w-full bg-sky-700 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:bg-sky-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                    >
                        {otp.status === 'loading' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            'Send OTP Verification'
                        )}
                    </button>
                ) : (
                    <div className="mt-6 bg-sky-50 border border-sky-100 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-sky-800 mb-3 font-medium">
                            Enter OTP sent to {countryCode} {phoneLocal}
                        </p>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <input
                                placeholder="XXXXXX"
                                className="flex-1 p-3.5 text-center tracking-[0.5em] font-bold text-xl border-2 border-sky-200 rounded-xl focus:border-sky-600 focus:ring-4 focus:ring-sky-100 outline-none bg-white transition-all"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                            />
                            <button
                                onClick={verifyOTP}
                                disabled={otp.status === 'loading'}
                                className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                            >
                                {otp.status === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : otp.verified ? (
                                    <>
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Verified
                                    </>
                                ) : (
                                    'Verify'
                                )}
                            </button>
                        </div>

                        {/* Resend OTP */}
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
                                {resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : otp.status === 'loading'
                                        ? 'Sending...'
                                        : 'Resend OTP'}
                            </button>
                        </div>
                    </div>
                )}

                {/* desktop next/back buttons for Step 3 */}
                <div className="hidden md:flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-8 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!otp.verified}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-base font-bold transition-all ${!otp.verified
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-sky-600 text-white shadow-lg hover:bg-sky-700 active:scale-[0.98]'
                            }`}
                    >
                        Continue
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

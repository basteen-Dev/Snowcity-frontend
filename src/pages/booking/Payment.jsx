import React from 'react';
import {
    CreditCard, Check, Ticket, ShoppingBag, ArrowRight, Shield,
    Tag, ChevronRight, Calendar, Clock, Users, Sparkles, Lock
} from 'lucide-react';

/**
 * Payment Component (Step 4 of Booking)
 * Corporate-grade UI with detailed order breakdown
 */
export default function Payment({
    OfferSelector,
    paymentGateway,
    setPaymentGateway,
    couponApplied,
    coupon,
    couponDiscount,
    selectedOfferDiscount,
    finalTotal,
    promoInput,
    setPromoInput,
    dispatch,
    setCouponCode,
    applyPromo,
    promosLoading,
    availablePromos,
    handleBack,
    onPlaceOrderAndPay,
    creating,
    paymentLoading,
    hasCartItems,
    cartItems = [],
    cartAddons = new Map(),
    totalAddonsCost = 0,
    grossTotal = 0,
    formatCurrency,
    dayjs,
}) {
    const ticketsTotal = cartItems.reduce(
        (acc, item) => acc + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
    );

    return (
        <div className="space-y-5 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
            {/* Header */}
            <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-3">
                    <Lock size={14} className="text-sky-600" />
                    <span className="text-xs font-semibold text-sky-700">Secure Checkout</span>
                </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="text-sky-600" size={18} />
                        Order Details
                        <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                        </span>
                    </h3>
                </div>

                <div className="divide-y divide-gray-50">
                    {cartItems.map((item, idx) => {
                        const unitPrice = Number(item.unitPrice || 0);
                        const quantity = Number(item.quantity || 0);
                        const lineTotal = unitPrice * quantity;

                        return (
                            <div key={item.key || idx} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                            {item.title || 'Ticket'}
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                                            {item.booking_date && dayjs && (
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar size={11} className="text-gray-400" />
                                                    {dayjs(item.booking_date).format('D MMM YYYY')}
                                                </span>
                                            )}
                                            {item.slotLabel && (
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock size={11} className="text-gray-400" />
                                                    {item.slotLabel}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <Users size={11} className="text-gray-400" />
                                                {quantity} {quantity === 1 ? 'ticket' : 'tickets'}
                                            </span>
                                        </div>
                                        {item.offerDescription && (
                                            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                                                <Sparkles size={10} /> {item.offerDescription}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-gray-900 tabular-nums">₹{lineTotal.toLocaleString()}</p>
                                        {quantity > 1 && (
                                            <p className="text-[11px] text-gray-400 tabular-nums">₹{unitPrice} × {quantity}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Addon line items */}
                    {totalAddonsCost > 0 && (
                        <div className="px-5 py-3 bg-purple-50/40">
                            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={12} /> Add-ons
                            </p>
                            {Array.from(cartAddons.entries()).map(([itemKey, addonsMap]) => {
                                if (!addonsMap || (addonsMap instanceof Map && addonsMap.size === 0)) return null;
                                const addonsArr = addonsMap instanceof Map ? Array.from(addonsMap.values()) : Object.values(addonsMap || {});
                                return addonsArr.filter((a) => Number(a?.quantity || 0) > 0).map((addon, i) => (
                                    <div key={`${itemKey}-${i}`} className="flex justify-between items-center py-1">
                                        <span className="text-xs text-gray-600">
                                            {addon.name || 'Add-on'} × {addon.quantity}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 tabular-nums">
                                            ₹{(Number(addon.price || 0) * Number(addon.quantity || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                ));
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Offers */}
            <OfferSelector />

            {/* Promo Code Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                    {couponApplied ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Check size={16} className="text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-emerald-800">
                                        {String(coupon.code || coupon.data?.code).toUpperCase()} applied
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                        {coupon.data?.description || `You save ₹${couponDiscount.toFixed(0)}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setPromoInput('');
                                        dispatch(setCouponCode(''));
                                    }}
                                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag size={12} /> Apply Promo Code
                            </p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <select
                                        className="w-full pl-9 pr-20 py-3 border border-gray-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-sky-500 focus:border-sky-400 outline-none font-bold tracking-wider appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 transition-all hover:border-gray-300"
                                        value={promoInput}
                                        onChange={(e) => setPromoInput(e.target.value)}
                                        disabled={promosLoading}
                                    >
                                        <option value="">
                                            {promosLoading ? 'Loading promos...' : 'Select a promo code'}
                                        </option>
                                        {availablePromos.map((promo) => (
                                            <option key={promo.id || promo.code} value={promo.code}>
                                                {promo.code} {promo.discount ? `(${promo.discount}% off)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={applyPromo}
                                        disabled={!promoInput || promosLoading}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold tracking-wide hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        APPLY
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Gateway Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-sky-600" size={18} />
                            Payment Method
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-medium border border-emerald-100">
                            <Shield size={10} /> Secure
                        </span>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PayPhi Option */}
                    <label
                        className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentGateway === 'payphi'
                            ? 'border-sky-500 bg-sky-50/60 shadow-md ring-1 ring-sky-200'
                            : 'border-gray-150 bg-white hover:border-sky-200 hover:shadow-sm'
                            }`}
                    >
                        <input
                            type="radio"
                            name="paymentGateway"
                            value="payphi"
                            checked={paymentGateway === 'payphi'}
                            onChange={() => setPaymentGateway('payphi')}
                            className="sr-only"
                        />
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentGateway === 'payphi' ? 'border-sky-500 bg-sky-500' : 'border-gray-300'
                                }`}
                        >
                            {paymentGateway === 'payphi' && (
                                <Check size={11} className="text-white" strokeWidth={3} />
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                            <CreditCard size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm">PayPhi</p>
                            <p className="text-[11px] text-gray-500">Cards · UPI · Netbanking</p>
                        </div>
                    </label>

                    {/* PhonePe Option */}
                    <label
                        className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentGateway === 'phonepe'
                            ? 'border-purple-500 bg-purple-50/60 shadow-md ring-1 ring-purple-200'
                            : 'border-gray-150 bg-white hover:border-purple-200 hover:shadow-sm'
                            }`}
                    >
                        <input
                            type="radio"
                            name="paymentGateway"
                            value="phonepe"
                            checked={paymentGateway === 'phonepe'}
                            onChange={() => setPaymentGateway('phonepe')}
                            className="sr-only"
                        />
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentGateway === 'phonepe' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                }`}
                        >
                            {paymentGateway === 'phonepe' && (
                                <Check size={11} className="text-white" strokeWidth={3} />
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm">PhonePe</p>
                            <p className="text-[11px] text-gray-500">UPI · Wallet · Cards</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="text-sky-600" size={18} />
                        Payment Summary
                    </h3>
                </div>

                <div className="px-5 py-4 space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tickets Subtotal</span>
                        <span className="font-semibold text-gray-800 tabular-nums">₹{ticketsTotal.toLocaleString()}</span>
                    </div>

                    {totalAddonsCost > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Add-ons</span>
                            <span className="font-semibold text-gray-800 tabular-nums">₹{totalAddonsCost.toLocaleString()}</span>
                        </div>
                    )}

                    {couponApplied && couponDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm text-emerald-700">
                            <span className="flex items-center gap-1">
                                <Tag size={12} />
                                Coupon ({String(coupon.code || coupon.data?.code).toUpperCase()})
                            </span>
                            <span className="font-semibold tabular-nums">-₹{couponDiscount.toFixed(0)}</span>
                        </div>
                    )}

                    {selectedOfferDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm text-emerald-700">
                            <span className="flex items-center gap-1">
                                <Sparkles size={12} />
                                Offer Discount
                            </span>
                            <span className="font-semibold tabular-nums">-₹{selectedOfferDiscount.toFixed(0)}</span>
                        </div>
                    )}

                    <div className="border-t border-dashed border-gray-200 pt-3 mt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-base">Total Amount</span>
                        <span className="font-extrabold text-2xl text-sky-700 tabular-nums">₹{finalTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 py-2">
                <div className="flex items-center gap-1.5 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[11px] font-medium">256-bit SSL</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Lock size={13} />
                    <span className="text-[11px] font-medium">PCI Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Shield size={13} />
                    <span className="text-[11px] font-medium">100% Secure</span>
                </div>
            </div>

            {/* Desktop Pay/Back Buttons */}
            <div className="hidden md:flex items-center gap-4 mt-6 pt-5 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={creating?.status === 'loading' || paymentLoading}
                    className="px-8 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onPlaceOrderAndPay}
                    disabled={creating?.status === 'loading' || paymentLoading || !hasCartItems}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold transition-all ${creating?.status === 'loading' || paymentLoading || !hasCartItems
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg shadow-sky-600/20 hover:from-sky-700 hover:to-sky-800 active:scale-[0.98]'
                        }`}
                >
                    {paymentLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Lock size={16} />
                            Pay ₹{finalTotal.toLocaleString()}
                        </>
                    )}
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

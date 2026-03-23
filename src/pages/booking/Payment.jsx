import React from 'react';
import { Link } from 'react-router-dom';
import {
    CreditCard, Check, Ticket, ShoppingBag, ArrowRight, Shield,
    Tag, ChevronRight, Calendar, Clock, Users, Sparkles, Lock
} from 'lucide-react';
import eazyLogo from '../../assets/images/eazy.png';
import phonepeLogo from '../../assets/images/payment_gateway_logo.png';

/**
 * Payment Component (Step 4 of Booking)
 * Matches reference: green pay button, secure badges, clean card layout
 */
export default function Payment({
    contact,
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
    selectedOfferId,
    state,
    getOfferId,
    getOfferTitle,
    getOfferSummary,
    cartItems,
    cartAddons,
    totalAddonsCost,
    grossTotal,
    formatCurrency,
    dayjs
}) {
    const ticketsTotal = cartItems.reduce(
        (acc, item) => acc + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-6">
                {/* Contact Information Summary */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-sky-600 rounded-full" />
                            Guest Details
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                            <p className="text-sm font-semibold text-gray-900">{contact?.name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                            <p className="text-sm font-semibold text-gray-900">{contact?.phone || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{contact?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                {/* Order Items Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="text-sky-600" size={18} />
                            Booking Details
                            <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xl">
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
                                                        {dayjs(item.booking_date).format('DD-MMM-YYYY')}
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
               {/* Payment Summary */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-5 py-4 space-y-2.5">
                        {/* <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Tickets</span>
                            <span className="font-semibold text-gray-800 tabular-nums">₹{ticketsTotal.toLocaleString()}</span>
                        </div>

                        {totalAddonsCost > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Add-ons</span>
                                <span className="font-semibold text-gray-800 tabular-nums">₹{totalAddonsCost.toLocaleString()}</span>
                            </div>
                        )} */}

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

                        <hr className="my-4" />
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span className="tabular-nums">₹{finalTotal.toLocaleString()}</span>
                        </div>
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
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl font-medium border border-emerald-100">
                                <Shield size={10} /> Secure
                            </span>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* PhonePe Option (Primary) */}
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
                                className={`w-5 h-5 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${paymentGateway === 'phonepe' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                    }`}
                            >
                                {paymentGateway === 'phonepe' && (
                                    <Check size={11} className="text-white" strokeWidth={3} />
                                )}
                            </div>
                            <img
                                src={phonepeLogo}
                                alt="PhonePe"
                                className="h-14 w-auto object-contain shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-500">UPI · Wallet · Cards</p>
                            </div>
                        </label>

                        {/* PayPhi Option (Secondary) */}
                        <label
                            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentGateway === 'payphi'
                                ? 'border-slate-400 bg-slate-50 shadow-md ring-1 ring-slate-200'
                                : 'border-gray-150 bg-white hover:border-slate-200 hover:shadow-sm'
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
                                className={`w-4 h-4 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${paymentGateway === 'payphi' ? 'border-slate-500 bg-slate-500' : 'border-gray-300'
                                    }`}
                            >
                                {paymentGateway === 'payphi' && (
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                )}
                            </div>
                            <img
                                src={eazyLogo}
                                alt="PayPhi"
                                className="h-14 w-auto object-contain shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-500">Cards · UPI · Netbanking</p>
                            </div>
                        </label>
                    </div>
                    
                </div>

               

                {/* Terms and Conditions Disclaimer */}
                <p className="text-[11px] text-gray-500 text-center mb-3">
                    By continuing, you agree to the <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">General Terms</Link>, <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Privacy Policy</Link>, and the <Link to="/cancellation-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Cancellation Policy</Link>.
                </p>

                {/* Pay Button */}
                <button
                    type="button"
                    onClick={onPlaceOrderAndPay}
                    disabled={creating?.status === 'loading' || paymentLoading || !hasCartItems}
                    className={`w-full py-4 rounded-xl transition-all shadow-lg font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] ${creating?.status === 'loading' || paymentLoading || !hasCartItems
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {paymentLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-xl animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Pay <span className="tabular-nums">₹{finalTotal.toLocaleString()}</span>
                        </>
                    )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                    🔒 100% Secure Payments • Instant Confirmation
                </p>

                {/* Back button (desktop) */}
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={creating?.status === 'loading' || paymentLoading}
                    className="hidden md:flex items-center justify-center gap-2 w-full px-8 py-3.5 border rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-bold shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                    Back
                </button>
            </div>
        </div>
    );
}

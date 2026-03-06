import React from 'react';
import { Ticket, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * OrderDetailsBox — Right-side sticky summary card
 * Matches reference: "Your Booking" card with Tickets / Add-ons / Total / Continue
 */
export default function OrderDetailsBox({
    cartItems,
    hasCartItems,
    onEditCartItem,
    onRemoveCartItem,
    finalTotal,
    handleNext,
    step,
    paymentLoading,
    cartAddons,
    otpVerified,
}) {
    return (
        <div className="lg:sticky lg:top-[180px]">
            <div className="bg-white p-6 rounded-xl shadow-xl">
                <h3 className="font-semibold text-lg mb-4">Your Booking</h3>

                {!hasCartItems ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                            <Ticket className="text-sky-600" />
                        </div>
                        <p className="text-sm text-gray-900 font-semibold mb-1">Let's build your adventure</p>
                        <p className="text-xs text-gray-500">Pick an attraction to begin your booking.</p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {cartItems.map((item) => {
                            const offerTitle = item.offer?.title || item.offer?.offerTitle || item.offerDescription || null;
                            const originalPrice = Number(item.originalPrice || item.basePrice || 0);
                            const unitPrice = Number(item.unitPrice || 0);
                            const qty = item.qty || item.quantity || 1;
                            const hasDiscount = offerTitle && originalPrice > unitPrice;

                            return (
                                <div
                                    key={item.key}
                                    className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 line-clamp-2">
                                            {item.title ||
                                                item.meta?.title ||
                                                (item.item_type && item.item_type.toLowerCase() === 'combo'
                                                    ? item.combo?.title ||
                                                    item.combo?.name ||
                                                    item.combo?.combo_name ||
                                                    `Combo #${item.combo_id || item.comboId}`
                                                    : item.attraction?.title ||
                                                    item.attraction?.name ||
                                                    `Attraction #${item.attraction_id || item.attractionId}`)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {qty} ticket(s) •{' '}
                                            {item.dateLabel || dayjs(item.booking_date).format('DD-MMM-YYYY') || item.booking_date}
                                            {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                                        </div>

                                        {offerTitle && (
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    🏷️ {offerTitle}
                                                </span>
                                            </div>
                                        )}

                                        {/* Render addons if cartAddons is provided */}
                                        {cartAddons && cartAddons.has(item.key) && (
                                            <div className="mt-2 space-y-1">
                                                {Array.from(cartAddons.get(item.key).values())
                                                    .filter(a => Number(a.quantity) > 0)
                                                    .map((addon, idx) => (
                                                        <div key={idx} className="flex justify-between text-[11px] text-gray-500 italic">
                                                            <span>{addon.name} x{addon.quantity}</span>
                                                            <span>₹{(Number(addon.price) * Number(addon.quantity)).toFixed(0)}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => onEditCartItem(item)}
                                                className="text-[11px] text-sky-700 hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveCartItem(item.key)}
                                                className="text-[11px] text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {hasDiscount && (
                                            <div className="text-xs text-gray-400 line-through tabular-nums">
                                                ₹{(originalPrice * qty).toFixed(0)}
                                            </div>
                                        )}
                                        <div className="font-semibold text-gray-900 tabular-nums">
                                            ₹{(unitPrice * qty).toFixed(0)}
                                        </div>
                                        {hasDiscount && (
                                            <div className="text-[10px] text-emerald-600 font-medium">
                                                Save ₹{((originalPrice - unitPrice) * qty).toFixed(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <hr className="my-4" />
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="tabular-nums">₹{finalTotal.toFixed(0)}</span>
                </div>

                <button
                    type="button"
                    disabled={!hasCartItems || (step === 3 && !otpVerified)}
                    onClick={handleNext}
                    className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${(!hasCartItems || (step === 3 && !otpVerified))
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-sky-600 text-white shadow-md hover:bg-sky-700'
                        }`}
                >
                    {step === 4 ? (paymentLoading ? 'Processing...' : `Pay ₹${finalTotal}`) : 'Continue →'}
                </button>
            </div>
        </div>
    );
}

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

export default function OrderDetailsBox({
    cartItems,
    hasCartItems,
    onEditCartItem,
    onRemoveCartItem,
    finalTotal,
    handleNext,
    step,
    paymentLoading,
}) {
    return (
        <div className="lg:sticky lg:top-[140px]">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Order details</h3>

                {!hasCartItems ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                            <ShoppingBag className="text-sky-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">The product you choose will be displayed here</p>
                        <p className="text-xs text-gray-400">Select a ticket and add to your order</p>
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
                                            {item.dateLabel || dayjs(item.booking_date).format('D MMMM YYYY') || item.booking_date}
                                            {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                                        </div>

                                        {offerTitle && (
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    🏷️ {offerTitle}
                                                </span>
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

                <div className="pt-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Total amount</span>
                        <span className="text-lg font-semibold text-sky-700 tabular-nums">
                            ₹{finalTotal.toFixed(0)}
                        </span>
                    </div>
                    <button
                        type="button"
                        disabled={!hasCartItems}
                        onClick={handleNext}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${!hasCartItems
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-[0.98]'
                            }`}
                    >
                        {step === 4 ? (paymentLoading ? 'Processing...' : `Pay ₹${finalTotal}`) : 'Continue'}
                        {step !== 4 && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

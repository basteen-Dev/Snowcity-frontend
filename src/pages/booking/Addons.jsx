import React from 'react';
import { ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * Addons Component (Step 2 of Booking)
 */
export default function Addons({
    cartItems,
    activeItemKey,
    setActiveCartItem,
    dispatch,
    addonsState,
    getAddonId,
    getAddonPrice,
    getAddonName,
    getAddonImage,
    currentItemAddons,
    handleAddonQuantityChange,
    cartAddons,
    onEditCartItem,
    onRemoveCartItem,
    finalTotal,
    handleNext,
    handleBack,
    hasCartItems,
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)] gap-6 items-start mt-4">
            <div className="space-y-6">
                {cartItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {cartItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => dispatch(setActiveCartItem(item.key))}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${item.key === activeItemKey
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-sky-200'
                                    }`}
                            >
                                {item.title ||
                                    item.meta?.title ||
                                    (item.item_type === 'combo'
                                        ? item.combo?.title ||
                                        item.combo?.name ||
                                        item.combo?.combo_name ||
                                        `Combo #${item.combo_id}`
                                        : item.attraction?.title ||
                                        item.attraction?.name ||
                                        `Attraction #${item.attraction_id}`) ||
                                    'Item'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    {addonsState.status === 'loading' ? (
                        <div className="text-center py-10 text-gray-500 text-sm">Loading add-ons...</div>
                    ) : (
                        <div className="space-y-4">
                            {(addonsState.items || []).map((addon) => {
                                const addonId = getAddonId(addon);
                                const price = getAddonPrice(addon);
                                const name = getAddonName(addon);
                                const image = getAddonImage(addon);
                                const quantity = Number(currentItemAddons.get(addonId)?.quantity || 0);

                                const formatCurrency = (val) => `₹${Number(val).toFixed(0)}`;

                                return (
                                    <div
                                        key={addonId}
                                        className="flex gap-4 items-center border border-gray-200 rounded-2xl p-4 hover:border-sky-200 transition-all"
                                    >
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={name}
                                                className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                                <ShoppingBag />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{name}</div>
                                            <div className="text-sm text-gray-500 tabular-nums">
                                                {formatCurrency(price)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleAddonQuantityChange(addonId, Math.max(0, quantity - 1), addon)
                                                }
                                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-200 active:scale-95 transition"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => handleAddonQuantityChange(addonId, quantity + 1, addon)}
                                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-200 active:scale-95 bg-sky-600 text-white shadow"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: order details */}
            <div className="lg:sticky lg:top-[140px]">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Order details</h3>

                    {!hasCartItems ? (
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                                <ShoppingBag className="text-sky-600" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                                The product you choose will be displayed here
                            </p>
                            <p className="text-xs text-gray-400">Select a ticket and add to your order</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                            {cartItems.map((item) => {
                                const itemAddonsMap = cartAddons.get(item.key) || new Map();
                                const itemAddons = Array.from(itemAddonsMap.values()).filter(
                                    (a) => Number(a.quantity) > 0
                                );
                                return (
                                    <div
                                        key={item.key}
                                        className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 line-clamp-2">
                                                {item.title ||
                                                    item.meta?.title ||
                                                    (item.item_type === 'combo'
                                                        ? item.combo?.title ||
                                                        item.combo?.name ||
                                                        item.combo?.combo_name ||
                                                        `Combo #${item.combo_id}`
                                                        : item.attraction?.title ||
                                                        item.attraction?.name ||
                                                        `Attraction #${item.attraction_id}`)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {item.quantity} ticket(s) •{' '}
                                                {item.dateLabel || dayjs(item.booking_date).format('D MMMM YYYY') || item.booking_date}
                                                {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                                            </div>

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

                                            {itemAddons.length > 0 && (
                                                <div className="mt-2 text-xs text-gray-600">
                                                    <div className="font-medium text-gray-700 mb-1">Extras</div>
                                                    <div className="space-y-1">
                                                        {itemAddons.map((a) => (
                                                            <div
                                                                key={a.addon_id}
                                                                className="flex items-center justify-between text-sm text-gray-600"
                                                            >
                                                                <div className="truncate">
                                                                    {a.name} <span className="text-xs text-gray-400">x{a.quantity}</span>
                                                                </div>
                                                                <div className="tabular-nums">
                                                                    ₹{(Number(a.price || 0) * Number(a.quantity || 0)).toFixed(0)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900 tabular-nums">
                                                ₹{(item.unitPrice * item.quantity).toFixed(0)}
                                            </div>
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
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={!hasCartItems}
                                onClick={handleNext}
                                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${!hasCartItems
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-[0.98]'
                                    }`}
                            >
                                <span>Continue</span>
                                <ArrowRight size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="hidden lg:flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all border border-gray-100"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus } from 'lucide-react';
import dayjs from 'dayjs';
import OrderDetailsBox from './OrderDetailsBox';

/**
 * Addons Component (Step 2 of Booking)
 * Matches reference: clean card layout, hover borders, Back/Continue buttons
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
    totalAddonCount,
    step,
    paymentLoading,
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mt-4">
            {/* LEFT: Addons list */}
            <div className="lg:col-span-2 space-y-6">
                {cartItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {cartItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => dispatch(setActiveCartItem(item.key))}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${item.key === activeItemKey
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

                <div className="space-y-4">
                    {addonsState.status === 'loading' ? (
                        <div className="text-center py-10 text-gray-500 text-sm">Loading add-ons...</div>
                    ) : (
                        (addonsState.items || []).map((addon) => {
                            const addonId = getAddonId(addon);
                            const price = getAddonPrice(addon);
                            const name = getAddonName(addon);
                            const image = getAddonImage(addon);
                            const quantity = Number(currentItemAddons.get(addonId)?.quantity || 0);
                            const isSelected = quantity > 0;

                            return (
                                <div
                                    key={addonId}
                                    className={`bg-white p-4 rounded-xl shadow border flex justify-between items-center cursor-pointer transition-all hover:border-sky-400 ${isSelected
                                        ? 'border-sky-500 ring-2 ring-sky-300'
                                        : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex gap-4 items-center flex-1 min-w-0">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={name}
                                                className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                <ShoppingBag size={20} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{name}</div>
                                            <div className="text-sm font-semibold text-sky-600 tabular-nums">₹{Number(price).toFixed(0)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() =>
                                                handleAddonQuantityChange(addonId, Math.max(0, quantity - 1), addon)
                                            }
                                            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-sky-300 active:scale-95 transition"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => handleAddonQuantityChange(addonId, quantity + 1, addon)}
                                            className="w-9 h-9 rounded-xl border border-sky-200 flex items-center justify-center active:scale-95 bg-sky-600 text-white shadow-sm"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="hidden lg:flex items-center gap-6 mt-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="px-8 py-3.5 border rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-semibold shadow-sm"
                    >
                        Back
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-10 py-3.5 rounded-xl font-bold shadow-md transition-all hover:bg-sky-700 active:scale-[0.98] bg-sky-600 text-white"
                        >
                            Continue
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="text-sm font-semibold text-gray-400 hover:text-sky-600 transition-all underline underline-offset-4"
                        >
                            Skip Add-ons
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Order summary */}
            <OrderDetailsBox
                cartItems={cartItems}
                hasCartItems={hasCartItems}
                onEditCartItem={onEditCartItem}
                onRemoveCartItem={onRemoveCartItem}
                finalTotal={finalTotal}
                handleNext={handleNext}
                step={step}
                paymentLoading={paymentLoading}
                cartAddons={cartAddons}
            />
        </div>
    );
}

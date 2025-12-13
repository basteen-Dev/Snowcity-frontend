/**
 * OrderSummaryBox.jsx
 * Displays cart items, add-ons, applied offers, and totals
 * Integrated with Buy X Get Y discount calculation
 */

import React, { useMemo } from 'react';
import { ShoppingBag, Gift, Percent, ArrowRight, Plus, Package, Tag, Sparkles, CheckCircle, Info, Star } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import dayjs from 'dayjs';

const getAddonName = (addon) => addon?.name ?? addon?.title ?? addon?.label ?? 'Addon';
const getAddonPrice = (a) => Number(a?.price ?? a?.amount ?? 0);

export default function OrderSummaryBox({
  cartItems = [],
  cartAddons = new Map(),
  offers = [],
  appliedOffer = null,
  grossTotal = 0,
  finalTotal = 0,
  discountAmount = 0,
  taxAmount = 0,
  hasCartItems = false,
  onContinue = () => {},
  disabled = false,
}) {
  // Calculate add-ons total for this cart
  const addonsTotal = useMemo(() => {
    let total = 0;
    cartItems.forEach((item) => {
      const itemAddonsMap = cartAddons.get(item.key) || new Map();
      Array.from(itemAddonsMap.values()).forEach((addon) => {
        total += (addon.price || 0) * (addon.quantity || 0);
      });
    });
    return total;
  }, [cartItems, cartAddons]);

  const subtotal = grossTotal - addonsTotal;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order details</h3>

      {!hasCartItems ? (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
            <ShoppingBag className="text-sky-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">The product you choose will be displayed here</p>
          <p className="text-xs text-gray-400">Select a ticket and add to your order</p>
        </div>
      ) : (
        <>
          {/* Items List */}
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {cartItems.map((item) => (
              <div key={item.key} className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 line-clamp-2">
                    {item.title ||
                      item.meta?.title ||
                      (item.item_type === 'combo'
                        ? item.combo?.title || item.combo?.name || `Combo #${item.combo_id}`
                        : item.attraction?.title || item.attraction?.name || `Attraction #${item.attraction_id}`)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.quantity} ticket(s) •{' '}
                    {item.dateLabel || dayjs(item.booking_date).format('DD MMM YYYY')}
                    {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                  </div>
                  
                  {/* Show add-ons for this item */}
                  {((cartAddons.get(item.key) || new Map()).size || 0) > 0 && (
                    <div className="text-xs text-gray-400 mt-2 space-y-1">
                      {Array.from((cartAddons.get(item.key) || new Map()).values())
                        .filter((a) => a.quantity > 0)
                        .map((addon, idx) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span>
                              + {getAddonName(addon)} x{addon.quantity}
                            </span>
                            <span className="text-gray-600">₹{(addon.price * addon.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900 tabular-nums">₹{(item.unitPrice * item.quantity).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Applied Offer Banner */}
          {appliedOffer && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-2 items-start">
                <Gift size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-green-900">
                    {appliedOffer.title || 'Offer Applied'}
                  </div>
                  {appliedOffer.description && (
                    <div className="text-xs text-green-700 mt-1">
                      {appliedOffer.description}
                    </div>
                  )}
                  <div className="text-xs text-green-700 mt-1">
                    {appliedOffer.discount_type === 'percent' 
                      ? `${appliedOffer.discount_percent}% discount`
                      : appliedOffer.discount_type === 'amount'
                      ? `Save ${formatCurrency(appliedOffer.discount_value)}`
                      : 'Special offer'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="pt-3 border-t border-gray-100 space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Items</span>
              <span className="font-medium text-gray-900">₹{subtotal.toFixed(0)}</span>
            </div>

            {addonsTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Add-ons</span>
                <span className="font-medium text-gray-900">₹{addonsTotal.toFixed(0)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Percent size={14} /> Discount
                </span>
                <span className="font-medium text-green-600">-₹{discountAmount.toFixed(0)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tax (18%)</span>
                <span className="font-medium text-gray-900">₹{taxAmount.toFixed(0)}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total amount</span>
              <span className="text-lg font-semibold text-sky-700 tabular-nums">₹{finalTotal.toFixed(0)}</span>
            </div>
            <button
              type="button"
              disabled={disabled || !hasCartItems}
              onClick={onContinue}
              className={`w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                disabled || !hasCartItems
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-[0.98]'
              }`}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

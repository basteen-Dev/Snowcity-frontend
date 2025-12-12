/**
 * useOfferCalculation.js
 * Custom hook to calculate Buy X Get Y offers in real-time
 * Updates discount whenever cart or offers change
 */

import { useEffect, useState, useCallback } from 'react';
import { checkBuyXGetYApplicability, calculateCartTotals } from '../services/offerCalculationService';

export function useOfferCalculation({
  cartItems = [],
  cartAddons = new Map(),
  offers = [],
  couponDiscount = 0,
  taxRate = 0.18,
} = {}) {
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    after_discount: 0,
    tax: 0,
    total: 0,
  });

  // Calculate item subtotal (without add-ons)
  const itemSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * (item.quantity || 0);
    }, 0);
  }, [cartItems]);

  // Calculate add-ons total
  const addonsTotal = useCallback(() => {
    let total = 0;
    cartItems.forEach((item) => {
      const itemAddonsMap = cartAddons.get(item.key) || new Map();
      Array.from(itemAddonsMap.values()).forEach((addon) => {
        total += (addon.price || 0) * (addon.quantity || 0);
      });
    });
    return total;
  }, [cartItems, cartAddons]);

  // Find and apply best offer
  useEffect(() => {
    if (!cartItems.length || !offers.length) {
      setAppliedOffer(null);
      setDiscountAmount(0);
      return;
    }

    // Find the best applicable Buy X Get Y offer
    let bestOffer = null;
    let bestDiscount = 0;

    for (const offer of offers) {
      if (!offer || offer.rule_type !== 'buy_x_get_y') continue;

      const result = checkBuyXGetYApplicability(cartItems, offer);
      if (result.applies && result.discount > bestDiscount) {
        bestOffer = result;
        bestDiscount = result.discount;
      }
    }

    if (bestOffer && bestOffer.applies) {
      setAppliedOffer(bestOffer);
      setDiscountAmount(bestOffer.discount);
    } else {
      setAppliedOffer(null);
      setDiscountAmount(0);
    }
  }, [cartItems, offers]);

  // Calculate totals
  useEffect(() => {
    const items = itemSubtotal();
    const addons = addonsTotal();
    const gross = items + addons;
    
    // Total discount = offer discount + coupon discount
    const totalDiscount = discountAmount + couponDiscount;

    const calculated = calculateCartTotals(gross, totalDiscount, taxRate);
    setTotals(calculated);
  }, [itemSubtotal, addonsTotal, discountAmount, couponDiscount, taxRate]);

  return {
    appliedOffer,
    discountAmount,
    ...totals,
    itemSubtotal: itemSubtotal(),
    addonsTotal: addonsTotal(),
    grossTotal: itemSubtotal() + addonsTotal(),
  };
}

export default useOfferCalculation;

/**
 * offerCalculationService.js
 * Handles Buy X Get Y offer calculation and discount application
 * Applied to cart items before order creation
 */

/**
 * Check if Buy X Get Y offer applies to cart items
 * @param {Array} cartItems - Cart items from store
 * @param {Object} offer - Offer object from API
 * @returns {Object} - { applies, discount, details }
 */
export function checkBuyXGetYApplicability(cartItems = [], offer = {}) {
  if (!offer || offer.rule_type !== 'buy_x_get_y') {
    return { applies: false, discount: 0, details: null };
  }

  const rules = offer.offer_rules || [];
  if (!rules.length) {
    return { applies: false, discount: 0, details: null };
  }

  const rule = rules[0]; // Single rule per offer
  const { buy_qty, get_qty, get_target_type, get_target_id, get_discount_type, get_discount_value } = rule;

  if (!buy_qty || !get_qty || !get_target_type || !get_target_id) {
    return { applies: false, discount: 0, details: null };
  }

  // Count matching items for the buy_qty
  const matchingItems = cartItems.filter(item => {
    // Any item that has quantity qualifies for "buy"
    return item.quantity > 0;
  });

  const totalQuantity = matchingItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Check if we have enough quantity to qualify
  if (totalQuantity < buy_qty) {
    return { applies: false, discount: 0, details: null };
  }

  // Calculate how many "sets" of buy_qty we have
  const sets = Math.floor(totalQuantity / buy_qty);
  const totalGetQty = sets * get_qty;

  // Calculate discount amount
  let discountAmount = 0;
  let freeItems = [];

  if (get_discount_type === 'Free') {
    // Find target item to get free
    const targetItem = cartItems.find(item => {
      if (get_target_type === 'attraction') {
        return item.item_type === 'attraction' && item.attraction_id === Number(get_target_id);
      } else if (get_target_type === 'combo') {
        return item.item_type === 'combo' && item.combo_id === Number(get_target_id);
      }
      return false;
    });

    if (targetItem) {
      discountAmount = (targetItem.unit_price || 0) * totalGetQty;
      freeItems = Array(totalGetQty).fill({
        name: targetItem.item_name,
        quantity: 1,
        price: targetItem.unit_price,
      });
    }
  } else if (get_discount_type === 'Percentage') {
    // Apply percentage discount to target item
    const targetItem = cartItems.find(item => {
      if (get_target_type === 'attraction') {
        return item.item_type === 'attraction' && item.attraction_id === Number(get_target_id);
      } else if (get_target_type === 'combo') {
        return item.item_type === 'combo' && item.combo_id === Number(get_target_id);
      }
      return false;
    });

    if (targetItem) {
      const percentageValue = Number(get_discount_value) || 0;
      discountAmount = ((targetItem.unit_price || 0) * percentageValue * totalGetQty) / 100;
    }
  } else if (get_discount_type === 'Amount') {
    // Fixed amount discount
    discountAmount = Number(get_discount_value || 0) * totalGetQty;
  }

  return {
    applies: discountAmount > 0,
    discount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    details: {
      offer_id: offer.id || offer.offer_id,
      offer_name: offer.name || offer.offer_name,
      rule_type: 'buy_x_get_y',
      buy_qty,
      get_qty: totalGetQty,
      get_target_type,
      get_target_id,
      get_discount_type,
      get_discount_value,
      qualifying_items: totalQuantity,
      discount_amount: Math.round(discountAmount * 100) / 100,
      description: generateOfferDescription(rule),
    },
  };
}

/**
 * Generate human-readable offer description
 */
export function generateOfferDescription(rule = {}) {
  const { buy_qty, get_qty, get_discount_type, get_discount_value } = rule;

  if (get_discount_type === 'Free') {
    return `Buy ${buy_qty} get ${get_qty} FREE`;
  } else if (get_discount_type === 'Percentage') {
    return `Buy ${buy_qty} get ${get_qty} with ${get_discount_value}% off`;
  } else if (get_discount_type === 'Amount') {
    return `Buy ${buy_qty} get ${get_qty} with ₹${get_discount_value} off`;
  }

  return `Buy ${buy_qty} get ${get_qty}`;
}

/**
 * Find the best applicable offer from a list
 * @param {Array} cartItems - Cart items
 * @param {Array} offers - List of available offers
 * @returns {Object} - Best applicable offer with discount details
 */
export function findBestApplicableOffer(cartItems = [], offers = []) {
  let bestOffer = null;
  let bestDiscount = { applies: false, discount: 0, details: null };

  for (const offer of offers) {
    if (!offer || offer.rule_type !== 'buy_x_get_y') continue;

    const result = checkBuyXGetYApplicability(cartItems, offer);
    if (result.applies && result.discount > bestDiscount.discount) {
      bestOffer = offer;
      bestDiscount = result;
    }
  }

  return {
    offer: bestOffer,
    ...bestDiscount,
  };
}

/**
 * Apply discount to cart totals
 * @param {number} subtotal - Original subtotal
 * @param {number} discountAmount - Calculated discount
 * @returns {Object} - { subtotal, discount, tax, total }
 */
export function calculateCartTotals(subtotal, discountAmount, taxRate = 0.18) {
  const discount = Math.min(discountAmount, subtotal); // Discount can't exceed subtotal
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = Math.round(afterDiscount * taxRate * 100) / 100;
  const total = afterDiscount + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    after_discount: Math.round(afterDiscount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Format offer display for UI
 */
export function formatOfferForDisplay(offer, discountDetails) {
  if (!offer || !discountDetails.applies) {
    return null;
  }

  return {
    id: offer.id || offer.offer_id,
    name: offer.name || offer.offer_name,
    description: discountDetails.details?.description,
    discount_amount: discountDetails.discount,
    formatted_discount: `₹${discountDetails.discount.toFixed(2)}`,
    rule_type: 'buy_x_get_y',
    details: discountDetails.details,
  };
}

export default {
  checkBuyXGetYApplicability,
  generateOfferDescription,
  findBestApplicableOffer,
  calculateCartTotals,
  formatOfferForDisplay,
};

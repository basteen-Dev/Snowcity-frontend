/**
 * orderDetailsService.js
 * Handles storing and formatting offer details, add-ons in orders
 * Manages the applied_offers and extras_details fields in orders
 */

/**
 * Build order metadata with applied offers and add-ons
 * @param {Object} params - { appliedOffer, cartAddons, cartItems }
 * @returns {Object} - { applied_offers, extras_details }
 */
export function buildOrderMetadata({
  appliedOffer = null,
  cartAddons = new Map(),
  cartItems = [],
}) {
  const appliedOffers = [];
  const extrasDetails = [];

  // Add applied offer details
  if (appliedOffer && appliedOffer.details) {
    appliedOffers.push({
      offer_id: appliedOffer.details.offer_id,
      offer_name: appliedOffer.details.offer_name,
      rule_type: appliedOffer.details.rule_type,
      buy_qty: appliedOffer.details.buy_qty,
      get_qty: appliedOffer.details.get_qty,
      get_target_type: appliedOffer.details.get_target_type,
      get_target_id: appliedOffer.details.get_target_id,
      discount_type: appliedOffer.details.get_discount_type,
      discount_value: appliedOffer.details.get_discount_value,
      discount_amount: appliedOffer.details.discount_amount,
      description: appliedOffer.details.description,
      applied_at: new Date().toISOString(),
    });
  }

  // Add item-specific add-ons
  cartItems.forEach((item) => {
    const itemAddonsMap = cartAddons.get(item.key) || new Map();
    const addons = Array.from(itemAddonsMap.values()).filter((a) => a.quantity > 0);

    if (addons.length > 0) {
      addons.forEach((addon) => {
        extrasDetails.push({
          item_key: item.key,
          item_type: item.item_type,
          item_id: item.item_type === 'attraction' ? item.attraction_id : item.combo_id,
          addon_id: addon.addon_id,
          addon_name: addon.name,
          addon_price: addon.price,
          quantity: addon.quantity,
          subtotal: addon.price * addon.quantity,
          applied_to_item: `${item.item_name} (Qty: ${item.quantity})`,
        });
      });
    }
  });

  return {
    applied_offers: appliedOffers.length > 0 ? appliedOffers : null,
    extras_details: extrasDetails.length > 0 ? extrasDetails : null,
  };
}

/**
 * Format order for display in booking details/receipt
 * @param {Object} order - Order from API
 * @returns {Object} - Formatted order with display fields
 */
export function formatOrderForDisplay(order = {}) {
  const {
    order_id,
    order_ref,
    total_amount,
    applied_offers,
    extras_details,
    bookings = [],
  } = order;

  // Format applied offers for display
  const displayOffers = applied_offers
    ? applied_offers.map((offer) => ({
        name: offer.offer_name,
        description: offer.description,
        discount: `₹${(offer.discount_amount || 0).toFixed(2)}`,
        type: 'Buy X Get Y',
      }))
    : [];

  // Format add-ons for display
  const displayAddons = extras_details
    ? extras_details.map((extra) => ({
        name: extra.addon_name,
        quantity: extra.quantity,
        price: `₹${(extra.addon_price || 0).toFixed(2)}`,
        subtotal: `₹${(extra.subtotal || 0).toFixed(2)}`,
        appliedTo: extra.applied_to_item,
      }))
    : [];

  // Calculate totals
  let subtotal = 0;
  let addonsTotal = 0;
  let discountTotal = 0;

  if (bookings && bookings.length > 0) {
    subtotal = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  }

  if (extras_details && extras_details.length > 0) {
    addonsTotal = extras_details.reduce((sum, e) => sum + (e.subtotal || 0), 0);
  }

  if (applied_offers && applied_offers.length > 0) {
    discountTotal = applied_offers.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
  }

  return {
    order_id,
    order_ref,
    total: `₹${(total_amount || 0).toFixed(2)}`,
    subtotal: `₹${subtotal.toFixed(2)}`,
    addons_total: `₹${addonsTotal.toFixed(2)}`,
    discount_total: `₹${discountTotal.toFixed(2)}`,
    applied_offers: displayOffers,
    add_ons: displayAddons,
    booking_count: bookings?.length || 0,
  };
}

/**
 * Format extras for ticket display
 * @param {Object} booking - Single booking/ticket
 * @param {Object} order - Parent order
 * @returns {Array} - Formatted add-ons for this booking
 */
export function getBookingAddons(booking, order = {}) {
  const extrasDetails = order.extras_details || [];
  const bookingAddons = extrasDetails.filter((extra) => {
    return (
      extra.item_key === booking.key ||
      (extra.item_type === booking.item_type &&
        extra.item_id ===
          (booking.item_type === 'attraction'
            ? booking.attraction_id
            : booking.combo_id))
    );
  });

  return bookingAddons.map((addon) => ({
    name: addon.addon_name,
    quantity: addon.quantity,
    price: addon.addon_price,
    subtotal: addon.subtotal,
  }));
}

/**
 * Format applied offers for ticket display
 * @param {Object} order - Parent order
 * @returns {Array} - Applied offers for display on ticket
 */
export function getOrderOffers(order = {}) {
  const appliedOffers = order.applied_offers || [];
  return appliedOffers.map((offer) => ({
    name: offer.offer_name,
    description: offer.description,
    discount_amount: offer.discount_amount,
    formatted: `${offer.description} - Save ₹${offer.discount_amount.toFixed(2)}`,
  }));
}

/**
 * Build summary text for order details box
 * @param {Object} params - { appliedOffer, addonsCount, discountAmount }
 * @returns {string} - Summary text
 */
export function buildOrderSummary({
  appliedOffer = null,
  addonsCount = 0,
  discountAmount = 0,
}) {
  const parts = [];

  if (appliedOffer) {
    parts.push(`✓ ${appliedOffer.details?.description || 'Offer applied'}`);
  }

  if (addonsCount > 0) {
    parts.push(`✓ ${addonsCount} add-on${addonsCount > 1 ? 's' : ''} selected`);
  }

  if (discountAmount > 0) {
    parts.push(`✓ Discount: ₹${discountAmount.toFixed(2)}`);
  }

  return parts.join(' • ');
}

/**
 * Validate extras for order creation
 * @param {Map} cartAddons - Map of add-ons by item key
 * @returns {Object} - { valid, errors }
 */
export function validateExtras(cartAddons = new Map()) {
  const errors = [];

  cartAddons.forEach((addonMap, itemKey) => {
    addonMap.forEach((addon, addonId) => {
      if (!addon.addon_id || !addon.name || addon.price === undefined) {
        errors.push(`Invalid add-on data for item ${itemKey}: ${addonId}`);
      }
      if (!Number.isInteger(addon.quantity) || addon.quantity < 0) {
        errors.push(`Invalid add-on quantity for ${addon.name} in item ${itemKey}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  buildOrderMetadata,
  formatOrderForDisplay,
  getBookingAddons,
  getOrderOffers,
  buildOrderSummary,
  validateExtras,
};

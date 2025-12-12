/**
 * BookingIntegrationGuide.md
 * Integration steps for Buy X Get Y offer, add-ons, and order details
 * 
 * This file documents the integration points needed in Booking.jsx
 */

## Integration Steps

### 1. Import New Services and Components (Top of Booking.jsx)

```javascript
import { useOfferCalculation } from '../hooks/useOfferCalculation';
import { 
  checkBuyXGetYApplicability, 
  generateOfferDescription 
} from '../services/offerCalculationService';
import { 
  buildOrderMetadata, 
  buildOrderSummary 
} from '../services/orderDetailsService';
import OrderSummaryBox from '../components/booking/OrderSummaryBox';
```

### 2. Update Component State

After the existing state initializations, add:

```javascript
// Offer calculation state
const [offerState, setOfferState] = useState({
  appliedOffer: null,
  discountAmount: 0,
  bestOffers: [],
});

// Use the offer calculation hook
const offerCalc = useOfferCalculation({
  cartItems,
  cartAddons,
  offers: state.offers || [],
  couponDiscount: coupon?.discount || 0,
  taxRate: 0.18,
});

// Merge calculated values
const grossTotal = offerCalc.itemSubtotal + offerCalc.addonsTotal;
const finalTotal = offerCalc.total;
const discountAmount = offerCalc.discountAmount;
const taxAmount = offerCalc.tax;
```

### 3. Update onPlaceOrderAndPay Function

Add offer and add-on metadata when creating order:

```javascript
const onPlaceOrderAndPay = async () => {
  if (creating?.status === 'loading') return;
  if (!hasToken) {
    setShowTokenExpiredModal(true);
    return;
  }
  if (!hasCartItems) return;

  try {
    const couponCode = (coupon?.code || '').trim() || undefined;
    const offerId = offerCalc.appliedOffer?.offer?.id;

    // Build order metadata with offers and add-ons
    const orderMetadata = buildOrderMetadata({
      appliedOffer: offerCalc.appliedOffer,
      cartAddons,
      cartItems,
    });

    const bookingPayloads = cartItems.map((item) => {
      const isCombo = item.item_type === 'Combo';
      const itemAddonsMap = cartAddons.get(item.key);
      const addonsPayload = itemAddonsMap
        ? Array.from(itemAddonsMap.values())
            .filter((a) => Number(a.quantity) > 0)
            .map((a) => ({ addon_id: a.addon_id, quantity: Number(a.quantity) }))
        : [];

      return {
        item_type: isCombo ? 'Combo' : 'Attraction',
        combo_id: isCombo ? item.combo_id : undefined,
        combo_slot_id: isCombo ? item.combo_slot_id : undefined,
        attraction_id: !isCombo ? item.attraction_id : undefined,
        slot_id: !isCombo ? item.slot_id : undefined,
        booking_date: item.booking_date,
        quantity: item.quantity,
        addons: addonsPayload,
        coupon_code: couponCode,
        offer_id: offerId,
        // NEW: Add order metadata
        order_meta: {
          applied_offers: orderMetadata.applied_offers,
          extras_details: orderMetadata.extras_details,
        },
      };
    });

    const created = await dispatch(createBooking(bookingPayloads)).unwrap();
    const orderId = created?.data?.order_id || created?.order_id;
    if (!orderId) throw new Error('Order ID missing');

    const email = (contact.email || auth?.user?.email || '').trim();
    const mobile = normalizePayphiMobile(contact.phone || auth?.user?.phone || '');

    const init = await dispatch(
      initiatePayPhi({ 
        bookingId: orderId, 
        email, 
        mobile, 
        amount: finalTotal,
        // Include order details
        orderDetails: {
          appliedOffer: offerCalc.appliedOffer,
          discount: discountAmount,
          total: finalTotal,
        }
      }),
    ).unwrap();
    
    if (init?.redirectUrl) {
      window.location.assign(init.redirectUrl);
    } else {
      alert('Payment initiation failed.');
    }
  } catch (err) {
    if (err?.status === 401 || err?.response?.status === 401) {
      setShowTokenExpiredModal(true);
    } else {
      alert(`Payment failed: ${err.message}`);
    }
  }
};
```

### 4. Replace Order Summary Display (STEP 1 - Right Panel)

Replace the existing order details section with:

```jsx
{/* Right: order details (same as STEP 1) */}
<div className="lg:sticky lg:top-28">
  <OrderSummaryBox
    cartItems={cartItems}
    cartAddons={cartAddons}
    offers={state.offers || []}
    appliedOffer={offerCalc.appliedOffer}
    grossTotal={grossTotal}
    finalTotal={finalTotal}
    discountAmount={discountAmount}
    taxAmount={taxAmount}
    hasCartItems={hasCartItems}
    onContinue={handleNext}
    disabled={!hasCartItems}
  />
</div>
```

### 5. Update Step 2 Order Summary (Add-ons Step)

In the Step 2 right panel, use the same OrderSummaryBox component:

```jsx
{/* Right: order details (same as STEP 1) */}
<div className="lg:sticky lg:top-28">
  <OrderSummaryBox
    cartItems={cartItems}
    cartAddons={cartAddons}
    offers={state.offers || []}
    appliedOffer={offerCalc.appliedOffer}
    grossTotal={grossTotal}
    finalTotal={finalTotal}
    discountAmount={discountAmount}
    taxAmount={taxAmount}
    hasCartItems={hasCartItems}
    onContinue={handleNext}
    disabled={!hasCartItems}
  />
</div>
```

### 6. Fix Double-Add Issue

Update the handleDirectBuy function to navigate instead of adding + showing next step:

```javascript
const handleDirectBuy = () => {
  if (!selectionReady) {
    alert('Please select date, time slot and quantity.');
    return;
  }

  // Check if already in cart (avoid duplicates)
  const fingerprint = buildFingerprint(sel);
  const alreadyInCart = cartItems.some((item) => item.fingerprint === fingerprint);

  if (!alreadyInCart) {
    addSelectionToCart();
  }

  // Navigate directly to add-ons/checkout - don't repeat the step
  dispatch(setStep(2));
};
```

### 7. Update MyBookings Page to Display Offers

In MyBookings.jsx, add to the order details display:

```jsx
// Show applied offers
{order.applied_offers && order.applied_offers.length > 0 && (
  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
    <h4 className="text-sm font-semibold text-green-900 mb-2">Applied Offers</h4>
    {order.applied_offers.map((offer, idx) => (
      <div key={idx} className="text-sm text-green-700">
        ✓ {offer.offer_name}: {offer.description}
        <br />
        <span className="text-xs">Save ₹{offer.discount_amount?.toFixed(2)}</span>
      </div>
    ))}
  </div>
)}

// Show add-ons
{order.extras_details && order.extras_details.length > 0 && (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">Add-ons & Extras</h4>
    {order.extras_details.map((extra, idx) => (
      <div key={idx} className="text-sm text-blue-700">
        • {extra.addon_name} (x{extra.quantity}): ₹{extra.subtotal?.toFixed(2)}
      </div>
    ))}
  </div>
)}
```

### 8. Update Ticket Display

In ticket components, show applied offer and add-ons:

```jsx
// Applied offers on ticket
{order.applied_offers && order.applied_offers.length > 0 && (
  <div className="border-t pt-3 mt-3">
    <p className="text-xs font-semibold text-gray-700 mb-2">OFFERS APPLIED:</p>
    {order.applied_offers.map((offer, idx) => (
      <p key={idx} className="text-xs text-gray-600">
        {offer.description} - Save ₹{offer.discount_amount?.toFixed(2)}
      </p>
    ))}
  </div>
)}

// Add-ons on ticket
{order.extras_details && order.extras_details.length > 0 && (
  <div className="border-t pt-3 mt-3">
    <p className="text-xs font-semibold text-gray-700 mb-2">ADD-ONS:</p>
    {order.extras_details
      .filter(e => e.item_id === booking.attraction_id || e.item_id === booking.combo_id)
      .map((extra, idx) => (
        <p key={idx} className="text-xs text-gray-600">
          {extra.addon_name} (x{extra.quantity}): ₹{extra.subtotal?.toFixed(2)}
        </p>
      ))}
  </div>
)}
```

## Backend Considerations

The backend /api/bookings (POST) endpoint should handle:
1. `applied_offers` field in order metadata
2. `extras_details` field in order metadata  
3. Store these in order JSON fields or separate tables
4. Return these fields in order details API

Example backend update:

```javascript
// In createBooking or createOrder controller
const orderMetadata = {
  applied_offers: req.body.applied_offers,
  extras_details: req.body.extras_details,
};

// Store in database
await ordersModel.create({
  ...orderData,
  applied_offers: orderMetadata.applied_offers, // JSON field
  extras_details: orderMetadata.extras_details,  // JSON field
});
```

## Database Schema Updates

Needed in orders table:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_offers JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extras_details JSONB;
```

## Testing Checklist

- [ ] Create cart with 2+ items
- [ ] Verify Buy X Get Y offer shows if applicable
- [ ] Check discount is calculated correctly
- [ ] Add add-ons and verify total updates
- [ ] Create order and verify offer/add-ons are stored
- [ ] View booking in MyBookings and see offer applied
- [ ] View ticket and see offer + add-ons listed
- [ ] Test from attraction page - no double-add when clicking "Book Now"
- [ ] Verify all totals including tax are correct

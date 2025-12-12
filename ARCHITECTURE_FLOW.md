# Buy X Get Y Discount System - Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SNOWCITY BOOKING SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │   ATTRACTIONS    │                                                       │
│  │ Attraction List  │                                                       │
│  │  Combo List      │─────────────────────┐                                │
│  └──────────────────┘                     │                                │
│                                           │                                │
│  ┌──────────────────┐                     ▼                                │
│  │   BOOKING PAGE   │  ┌─────────────────────────────┐                     │
│  │  (Step 1-4)      │  │  CART STATE MANAGEMENT      │                     │
│  │                  │  │  - cart.items[]             │                     │
│  │  * Select Items  │  │  - cart.activeKey           │                     │
│  │  * Add Add-ons   │  │  - cartAddons Map<key,Map>  │                     │
│  │  * Checkout      │  │                             │                     │
│  │  * Pay           │  └──────────────┬──────────────┘                     │
│  └──────────────────┘                 │                                    │
│           │                            │                                    │
│           │                   ┌────────▼────────┐                          │
│           │                   │  useOfferCalc   │                          │
│           │                   │    Hook         │                          │
│           │                   │                 │                          │
│           │                   │ - Finds best    │                          │
│           │                   │   offer         │                          │
│           │                   │ - Calculates    │                          │
│           │                   │   discount      │                          │
│           │                   │ - Computes tax  │                          │
│           │                   │ - Returns total │                          │
│           │                   └────────┬────────┘                          │
│           │                            │                                    │
│           │           ┌────────────────┴─────────────────┐                │
│           │           ▼                                  ▼                │
│     ┌──────────────────────────┐              ┌──────────────────────────┐│
│     │ OrderSummaryBox          │              │ orderDetailsService.js   ││
│     │ Component                │              │                          ││
│     │                          │              │ - buildOrderMetadata()   ││
│     │ Displays:                │              │ - formatOrderForDisplay()││
│     │ ✓ Cart items             │              │ - getBookingAddons()     ││
│     │ ✓ Add-ons                │              │ - getOrderOffers()       ││
│     │ ✓ Applied offer          │              │ - validateExtras()       ││
│     │ ✓ Price breakdown        │              │                          ││
│     │ ✓ Final total            │              │ Returns: { applied_... } ││
│     │                          │              │          { extras_...   }││
│     └────────────┬─────────────┘              └──────────────────────────┘│
│                  │                                       ▲                  │
│                  └───────────────────┬───────────────────┘                 │
│                                      │                                     │
│                                      ▼                                     │
│                    ┌──────────────────────────────┐                        │
│                    │  CREATE ORDER                │                        │
│                    │  POST /api/bookings          │                        │
│                    │                              │                        │
│                    │ Payload:                     │                        │
│                    │ {                            │                        │
│                    │   items: [...],              │                        │
│                    │   order_meta: {              │                        │
│                    │     applied_offers: [...],   │                        │
│                    │     extras_details: [...]    │                        │
│                    │   }                          │                        │
│                    │ }                            │                        │
│                    └──────────────┬───────────────┘                        │
│                                   │                                        │
│                                   ▼                                        │
│            ┌──────────────────────────────────────┐                       │
│            │     BACKEND DATABASE                 │                       │
│            │                                      │                       │
│            │  orders table:                       │                       │
│            │  ✓ applied_offers (JSONB)           │                       │
│            │  ✓ extras_details (JSONB)           │                       │
│            │  ✓ total_amount                     │                       │
│            │  ✓ payment_status                   │                       │
│            │                                      │                       │
│            │  bookings table:                     │                       │
│            │  ✓ order_id (FK)                    │                       │
│            │  ✓ booking details                  │                       │
│            └──────────────┬───────────────────────┘                       │
│                           │                                                │
│                           ▼                                                │
│            ┌──────────────────────────────────────┐                       │
│            │     GET ORDER (My Bookings)          │                       │
│            │     GET /api/bookings/:id            │                       │
│            │                                      │                       │
│            │  Response includes:                  │                       │
│            │  ✓ applied_offers                    │                       │
│            │  ✓ extras_details                    │                       │
│            │  ✓ all booking details               │                       │
│            └──────────────┬───────────────────────┘                       │
│                           │                                                │
│                           ▼                                                │
│            ┌──────────────────────────────────────┐                       │
│            │  MY BOOKINGS / TICKET VIEW           │                       │
│            │  Display:                            │                       │
│            │  ✓ Applied offers with description   │                       │
│            │  ✓ Discount amount                   │                       │
│            │  ✓ Add-ons for each booking          │                       │
│            │  ✓ Final order total                 │                       │
│            └──────────────────────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Offer Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OFFER CALCULATION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  1. CART ITEM ADDED
     ┌──────────────────┐
     │ Item:            │
     │ - attraction_id  │
     │ - quantity       │
     │ - unit_price     │
     │ - booking_date   │
     │ - key            │
     └─────────┬────────┘
               │
               ▼
  2. useOfferCalculation Hook Triggered
     ┌────────────────────────────────┐
     │ Dependencies change:            │
     │ - cartItems                     │
     │ - offers list                   │
     │ - cartAddons                    │
     └─────────┬──────────────────────┘
               │
               ▼
  3. Check Each Offer
     ┌─────────────────────────────────────────────────┐
     │ for (each offer in offers) {                    │
     │   if (offer.rule_type !== 'buy_x_get_y') skip; │
     │                                                 │
     │   result = checkBuyXGetYApplicability(          │
     │     cartItems, offer                            │
     │   );                                            │
     │                                                 │
     │   if (result.applies && result.discount > best) │
     │     bestOffer = result;                        │
     │ }                                               │
     └─────────┬──────────────────────────────────────┘
               │
               ▼
  4. Offer Applicability Check
     ┌────────────────────────────────────────┐
     │ For offer:                              │
     │ {                                      │
     │   buy_qty: 2,          ← Buy how many │
     │   get_qty: 1,          ← Get how many │
     │   get_target_id: 5,    ← Which item   │
     │   get_discount_type: "Free"            │
     │ }                                      │
     │                                        │
     │ Count items in cart: 3 tickets         │
     │ Sets qualifying: 3 / 2 = 1 set        │
     │ Items to discount: 1 * 1 = 1 item     │
     │ Discount amount: $300 (1 × item price)│
     └─────────┬────────────────────────────┘
               │
               ▼
  5. Calculate Totals
     ┌─────────────────────────────────────┐
     │ Items subtotal:        $1000         │
     │ Add-ons:               $200          │
     │ Gross total:           $1200         │
     │                                      │
     │ Offer discount:        -$300         │
     │ After discount:        $900          │
     │                                      │
     │ Tax (18%):             $162          │
     │ FINAL TOTAL:           $1062         │
     └─────────┬───────────────────────────┘
               │
               ▼
  6. Return Calculation Result
     ┌──────────────────────────────────────┐
     │ {                                    │
     │   appliedOffer: {...},               │
     │   discountAmount: 300,               │
     │   subtotal: 900,                     │
     │   tax: 162,                          │
     │   total: 1062,                       │
     │   itemSubtotal: 1000,                │
     │   addonsTotal: 200,                  │
     │   grossTotal: 1200                   │
     │ }                                    │
     └──────────┬───────────────────────────┘
                │
                ▼
  7. Display in OrderSummaryBox
     ┌──────────────────────────────┐
     │ Items:                       │
     │ - Attraction A × 2: $600    │
     │ - Combo B × 1: $400         │
     │                              │
     │ Add-ons:                     │
     │ - Photography × 2: $200     │
     │                              │
     │ ✓ Free Combo B! -$300       │
     │                              │
     │ Subtotal:  $1200            │
     │ Discount:  -$300            │
     │ Tax:       $162             │
     │ TOTAL:     $1062            │
     └──────────────────────────────┘
```

## Data Flow: From Booking to Database

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: BOOKING → DATABASE                              │
└──────────────────────────────────────────────────────────────────────────────┘

STEP 1: User Makes Selections
┌────────────────────────┐
│ cart = {               │
│   items: [             │
│     {                  │
│       key: "ci_xxx",   │
│       item_type: "Attraction", │
│       attraction_id: 3,│
│       quantity: 2,     │
│       booking_date: "2025-12-15" │
│     },                 │
│     {                  │
│       key: "ci_yyy",   │
│       item_type: "Combo",      │
│       combo_id: 5,     │
│       quantity: 1      │
│     }                  │
│   ],                   │
│   activeKey: "ci_xxx"  │
│ }                      │
│                        │
│ cartAddons = Map {     │
│   "ci_xxx" => Map {    │
│     1 => { addon_id: 1,│
│             quantity: 2 │
│     }                  │
│   }                    │
│ }                      │
└────────────────────────┘
         │
         ▼
STEP 2: Calculate Order Metadata
┌─────────────────────────────────────────────────┐
│ buildOrderMetadata({                            │
│   appliedOffer: {                               │
│     details: {                                  │
│       offer_id: 7,                              │
│       offer_name: "Buy 2 Get 1 Free",           │
│       rule_type: "buy_x_get_y",                 │
│       discount_amount: 300,                     │
│       description: "Buy 2 get 1 FREE"           │
│     }                                           │
│   },                                            │
│   cartAddons,                                   │
│   cartItems                                     │
│ })                                              │
│                                                 │
│ Returns:                                        │
│ {                                               │
│   applied_offers: [{                            │
│     offer_id: 7,                                │
│     offer_name: "Buy 2 Get 1 Free",             │
│     rule_type: "buy_x_get_y",                   │
│     buy_qty: 2,                                 │
│     get_qty: 1,                                 │
│     get_target_type: "combo",                   │
│     get_target_id: 5,                           │
│     discount_type: "Free",                      │
│     discount_value: null,                       │
│     discount_amount: 300,                       │
│     description: "Buy 2 get 1 FREE",            │
│     applied_at: "2025-12-12T10:30:00Z"          │
│   }],                                           │
│   extras_details: [{                            │
│     item_key: "ci_xxx",                         │
│     item_type: "Attraction",                    │
│     item_id: 3,                                 │
│     addon_id: 1,                                │
│     addon_name: "Photography",                  │
│     addon_price: 100,                           │
│     quantity: 2,                                │
│     subtotal: 200,                              │
│     applied_to_item: "Attraction #3 (Qty: 2)"   │
│   }]                                            │
│ }                                               │
└────────────┬────────────────────────────────────┘
             │
             ▼
STEP 3: Create Order API Request
┌────────────────────────────────────────────────┐
│ POST /api/bookings                             │
│                                                │
│ {                                              │
│   items: [                                     │
│     {                                          │
│       item_type: "Attraction",                 │
│       attraction_id: 3,                        │
│       slot_id: 12,                             │
│       booking_date: "2025-12-15",              │
│       quantity: 2,                             │
│       addons: [{addon_id: 1, quantity: 2}],   │
│       order_meta: {                            │
│         applied_offers: [...],  ◄─ metadata   │
│         extras_details: [...]   ◄─ metadata   │
│       }                                        │
│     },                                         │
│     {                                          │
│       item_type: "Combo",                      │
│       combo_id: 5,                             │
│       combo_slot_id: 45,                       │
│       booking_date: "2025-12-15",              │
│       quantity: 1,                             │
│       addons: [],                              │
│       order_meta: {                            │
│         applied_offers: [...],  ◄─ metadata   │
│         extras_details: [...]   ◄─ metadata   │
│       }                                        │
│     }                                          │
│   ]                                            │
│ }                                              │
└────────────┬────────────────────────────────────┘
             │
             ▼
STEP 4: Backend Saves Order
┌───────────────────────────────────────────────┐
│ Database:                                     │
│                                               │
│ INSERT INTO orders (                          │
│   user_id: 42,                                │
│   order_ref: "ORD20251212xxx",                │
│   total_amount: 1062,                         │
│   applied_offers: { applied_offers: [...] },  │
│   extras_details: { extras_details: [...] },  │
│   created_at: NOW()                           │
│ )                                             │
│ RETURNING order_id = 789;                     │
│                                               │
│ INSERT INTO bookings (                        │
│   order_id: 789,                              │
│   attraction_id: 3,                           │
│   booking_date: "2025-12-15",                 │
│   quantity: 2,                                │
│   total_price: 600,                           │
│   extras_applied: true                        │
│ );                                            │
│                                               │
│ INSERT INTO bookings (                        │
│   order_id: 789,                              │
│   combo_id: 5,                                │
│   booking_date: "2025-12-15",                 │
│   quantity: 1,                                │
│   total_price: 400,                           │
│   offer_applied: true                         │
│ );                                            │
└────────────┬────────────────────────────────────┘
             │
             ▼
STEP 5: User Views in My Bookings
┌────────────────────────────────────────────────┐
│ GET /api/bookings/789                          │
│                                                │
│ Response:                                      │
│ {                                              │
│   order_id: 789,                               │
│   order_ref: "ORD20251212xxx",                 │
│   user_id: 42,                                 │
│   total_amount: 1062,                          │
│   applied_offers: [{                           │
│     offer_id: 7,                               │
│     offer_name: "Buy 2 Get 1 Free",            │
│     description: "Buy 2 get 1 FREE",           │
│     discount_amount: 300                       │
│   }],                                          │
│   extras_details: [{                           │
│     addon_id: 1,                               │
│     addon_name: "Photography",                 │
│     quantity: 2,                               │
│     subtotal: 200                              │
│   }],                                          │
│   bookings: [                                  │
│     {                                          │
│       booking_id: 1001,                        │
│       attraction_id: 3,                        │
│       quantity: 2,                             │
│       booking_date: "2025-12-15",              │
│       total_price: 600,                        │
│       status: "CONFIRMED"                      │
│     },                                         │
│     {                                          │
│       booking_id: 1002,                        │
│       combo_id: 5,                             │
│       quantity: 1,                             │
│       booking_date: "2025-12-15",              │
│       total_price: 400,                        │
│       status: "CONFIRMED"                      │
│     }                                          │
│   ]                                            │
│ }                                              │
└────────────┬────────────────────────────────────┘
             │
             ▼
STEP 6: Display in My Bookings UI
┌──────────────────────────────────────────────┐
│ ORDER #ORD20251212xxx                         │
│ Date: 15 Dec 2025                             │
│ Status: ✓ CONFIRMED                           │
│                                               │
│ APPLIED OFFERS                                │
│ ✓ Buy 2 Get 1 Free                            │
│   Save ₹300                                   │
│                                               │
│ BOOKINGS                                      │
│ 1. Attraction #3                              │
│    2 × ₹300 = ₹600                           │
│                                               │
│ 2. Combo #5                                   │
│    1 × ₹400 = ₹400                           │
│                                               │
│ ADD-ONS                                       │
│ • Photography × 2: ₹200                       │
│                                               │
│ TOTAL: ₹1,062                                 │
└──────────────────────────────────────────────┘
```

## Component Props Flow

```
App (Redux State)
├── cart.items
├── cart.activeKey
├── coupon.discount
├── offers[]
│
└── Booking.jsx
    ├── useOfferCalculation({
    │   cartItems,
    │   cartAddons,
    │   offers,
    │   couponDiscount
    │ })
    │   ↓ Returns
    │   ├── appliedOffer
    │   ├── discountAmount
    │   ├── total
    │   ├── tax
    │   └── ...
    │
    └── OrderSummaryBox({
        cartItems,
        cartAddons,
        offers,
        appliedOffer,
        grossTotal,
        finalTotal,
        discountAmount,
        taxAmount,
        onContinue
    })
```

---

This architecture ensures:
✅ Real-time offer calculation
✅ Accurate price breakdown
✅ Complete order metadata storage
✅ Full order details in bookings view
✅ Add-ons properly attributed to items
✅ Applied offers visible throughout flow

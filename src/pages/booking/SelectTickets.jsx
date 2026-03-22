import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ShoppingBag, ChevronRight, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import OrderDetailsBox from './OrderDetailsBox';
import { prioritizeSnowcityFirst, getNextAvailableDate } from '../../utils/attractions';
import api from '../../services/apiClient';


/**
 * SelectTickets Component (Step 1 of Booking)
 */
export default function SelectTickets({
  sel,
  setSel,
  combos,
  prioritizedAttractions,
  cartItems,
  hasCartItems,
  finalTotal,
  todayYMD,
  handleToday,
  handleTomorrow,
  todayBlocked = false,
  tomorrowBlocked = false,
  onCalendarButtonClick,
  setCalendarAnchor,
  formatDateDisplay,
  getAttrId,
  getComboId,
  getComboDisplayPrice,
  getPrice,
  getComboLabel,
  getComboPrimaryImage,
  getAttractionImage,
  idsMatch,
  onEditCartItem,
  setDetailsMainImage,
  setDrawerMode,
  setDrawerOpen,
  onRemoveCartItem,
  handleNext,
  step,
  paymentLoading,
  cartAddons,
  setEditingKey,
  offers = [],
}) {
  // expandedCardId state removed as description is now fully visible

  const isOfferDateAllowed = (dateValue, offer, rule) => {
    if (!dateValue) return false;
    const date = dayjs(dateValue).format('YYYY-MM-DD');
    if (offer?.valid_from && date < String(offer.valid_from).slice(0, 10)) return false;
    if (offer?.valid_to && date > String(offer.valid_to).slice(0, 10)) return false;
    if (rule?.specific_date && date !== String(rule.specific_date).slice(0, 10)) return false;
    if (rule?.date_from && date < String(rule.date_from).slice(0, 10)) return false;
    if (rule?.date_to && date > String(rule.date_to).slice(0, 10)) return false;
    if (rule?.day_type) {
      const dayIndex = dayjs(date).day();
      const dayType = String(rule.day_type).toLowerCase();
      if (dayType === 'weekday' && (dayIndex < 1 || dayIndex > 5)) return false;
      if (dayType === 'weekend' && !(dayIndex === 0 || dayIndex === 6)) return false;
      if (dayType === 'custom' && Array.isArray(rule.specific_days)) {
        if (!rule.specific_days.map(Number).includes(dayIndex)) return false;
      }
    }
    return true;
  };

  const getNextValidOfferDate = (offer, rule, lookAheadDays = 60) => {
    const start = dayjs();
    for (let i = 0; i <= lookAheadDays; i += 1) {
      const candidate = start.add(i, 'day').format('YYYY-MM-DD');
      if (isOfferDateAllowed(candidate, offer, rule)) return candidate;
    }
    return '';
  };

  const ProductList = () => {
    const activeTab = sel.itemType;
    const [offerAvailability, setOfferAvailability] = useState({});
    const data = useMemo(() => {
      if (activeTab === 'offer') {
        return offers;
      }
      if (activeTab !== 'attraction') return combos;
      return prioritizedAttractions;
    }, [activeTab, prioritizedAttractions, combos, offers]);

    // Fetch availability for first_n_tickets offers
    useEffect(() => {
      if (activeTab !== 'offer') return;
      const fntOffers = offers.filter(o => String(o.rule_type || '').toLowerCase() === 'first_n_tickets');
      if (fntOffers.length === 0) return;

      fntOffers.forEach(async (offer) => {
        const offerId = offer.offer_id || offer.id;
        const rules = Array.isArray(offer.rules) ? offer.rules : [];
        const firstRule = rules[0] || null;
        // Find the next valid date for this offer
        const nextDate = getNextValidOfferDate(offer, firstRule);
        if (!nextDate) return;

        try {
          const res = await api.get(`/offers/${offerId}/availability`, { params: { date: nextDate } });
          const avail = res?.data || res || {};
          setOfferAvailability(prev => ({ ...prev, [String(offerId)]: avail }));
        } catch (err) {
          // silently fail
        }
      });
    }, [activeTab, offers]);

    return (
      <div className="space-y-4">
        {/* Toggle */}
        <div className="mb-2">
          <div className="bg-sky-50 p-1 rounded-xl inline-flex border border-sky-100 flex-wrap gap-1">
            {['combo','attraction', 'offer'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSel((prev) => ({
                    ...prev,
                    itemType: t,
                    attractionId: '',
                    comboId: '',
                    slotKey: '',
                    offerId: '',
                  }));
                }}
                className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${sel.itemType === t
                  ? 'bg-white text-sky-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t === 'attraction' ? 'Attractions' : t === 'combo' ? 'Combos' : 'Offers'}
              </button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            {sel.itemType === 'combo' ? 'No combos available' : sel.itemType === 'offer' ? 'No active offers available' : 'No attractions available'}
          </div>
        ) : (
          data.map((item) => {
            const isOffer = sel.itemType === 'offer';
            const id = isOffer ? (item.offer_id || item.id) : sel.itemType === 'attraction' ? getAttrId(item) : getComboId(item);
            const isSelected =
              String(isOffer ? sel.offerId : sel.itemType === 'attraction' ? sel.attractionId : sel.comboId) === String(id);

            const basePrice = isOffer ? null :
              sel.itemType === 'combo'
                ? Number(getComboDisplayPrice(item) || 0)
                : Number(getPrice(item) || item.price || item.base_price || item.amount || 0);

            const title = isOffer ? (item.title || item.name) : sel.itemType === 'attraction' ? item.title || item.name : getComboLabel(item);

            const image = isOffer ? (item.image_url || null) :
              sel.itemType === 'combo' ? getComboPrimaryImage(item) : getAttractionImage(item);

            const onSelect = () => {
              if (typeof setEditingKey === 'function') setEditingKey(null);

              if (isOffer) {
                const offerRules = Array.isArray(item?.rules) ? item.rules : Array.isArray(item?.offer_rules) ? item.offer_rules : [];
                const firstRule = offerRules[0] || null;
                const ruleType = String(item?.rule_type || '').toLowerCase();
                const isBuyXGetY = ruleType === 'buy_x_get_y';
                const isFirstNTickets = ruleType === 'first_n_tickets';
                const nextOfferDate = getNextValidOfferDate(item, firstRule);

                // For first_n_tickets, open the dedicated drawer
                if (isFirstNTickets) {
                  // Check if sold out
                  const avail = offerAvailability[String(id)];
                  if (avail?.is_sold_out) {
                    return; // Do nothing if sold out
                  }

                  setSel((prev) => ({
                    ...prev,
                    itemType: 'offer',
                    offerId: String(id),
                    attractionId: '',
                    comboId: '',
                    slotKey: '',
                  }));
                  setDrawerMode('offer');
                  setDrawerOpen(true);
                  return;
                }

                if (isBuyXGetY) {
                  setSel((prev) => ({
                    ...prev,
                    itemType: 'offer',
                    offerId: String(id),
                    attractionId: '',
                    comboId: '',
                    slotKey: '',
                    date: nextOfferDate || prev.date,
                  }));
                  setDrawerMode('offer');
                  setDrawerOpen(true);
                  return;
                }

                const targetType = String(firstRule?.target_type || '').toLowerCase();
                const targetId = firstRule?.target_id != null ? String(firstRule.target_id) : '';

                setSel((prev) => ({
                  ...prev,
                  itemType: targetType === 'combo' ? 'combo' : 'attraction',
                  attractionId: targetType === 'attraction' ? targetId : '',
                  comboId: targetType === 'combo' ? targetId : '',
                  offerId: String(id),
                  slotKey: '',
                  date: nextOfferDate || prev.date,
                }));
                setDrawerMode('booking');
                setDrawerOpen(true);
                return;
              }

              setSel((prev) => ({
                ...prev,
                itemType: sel.itemType,
                attractionId: sel.itemType === 'attraction' ? String(id) : '',
                comboId: sel.itemType === 'combo' ? String(id) : '',
                date: getNextAvailableDate(item),
                slotKey: '',
              }));
              setDrawerMode('booking');
              setDrawerOpen(true);
            };

            return (
              <div
                key={id}
                className={`bg-white rounded-3xl shadow-sm border p-4 sm:p-5 flex gap-4 transition-all ${isSelected ? 'border-sky-400 shadow-md' : 'border-gray-100 hover:border-sky-200'
                  }`}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-gray-100 bg-sky-50 shrink-0 self-start">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-400">
                      <ShoppingBag />
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      {title}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1 break-words">
                      {(item.short_description || item.subtitle || 'Instant confirmation • Best experience').replace(/<[^>]*>/g, '')}
                    </div>
                    {sel.itemType !== 'offer' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSel((prev) => ({
                            ...prev,
                            itemType: sel.itemType,
                            attractionId: sel.itemType === 'attraction' ? String(id) : '',
                            comboId: sel.itemType === 'combo' ? String(id) : '',
                            slotKey: '',
                          }));
                          setDetailsMainImage(image || null);
                          setDrawerMode('details');
                          setDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-900 mt-2"
                      >
                        View details
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-row items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {!isOffer && (
                        <>
                        <div className="text-left text-xs text-gray-500 uppercase tracking-wide">From</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg sm:text-xl font-bold text-sky-700 tabular-nums">
                            ₹{basePrice || 0}
                          </span>
                        </div>
                        </>
                      )}
                      {isOffer && (
                        <div className="mb-2">
                          {(() => {
                            const ruleType = String(item?.rule_type || '').toLowerCase();
                            const isFirstNTickets = ruleType === 'first_n_tickets';
                            const offerRules = Array.isArray(item?.rules) ? item.rules : [];
                            const firstRule = offerRules[0] || null;
                            const avail = offerAvailability[String(id)];

                            if (isFirstNTickets && avail?.is_sold_out) {
                              return (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                    <AlertTriangle size={10} /> SOLD OUT
                                  </span>
                                </div>
                              );
                            }
                            if (isFirstNTickets && avail) {
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base sm:text-lg font-bold text-emerald-700">₹{avail.offer_price}</span>
                                    <span className="text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">LIMITED</span>
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {avail.tickets_remaining} left
                                  </div>
                                </div>
                              );
                            }
                            if (isFirstNTickets && firstRule?.offer_price) {
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-base sm:text-lg font-bold text-emerald-700">₹{firstRule.offer_price}</span>
                                  <span className="text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">LIMITED</span>
                                </div>
                              );
                            }
                            return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">PROMO</span>;
                          })()}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onSelect}
                      disabled={isOffer && String(item?.rule_type || '').toLowerCase() === 'first_n_tickets' && offerAvailability[String(id)]?.is_sold_out}
                      className={`px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm active:scale-[0.98] transition-all border shrink-0 ${
                        isOffer && String(item?.rule_type || '').toLowerCase() === 'first_n_tickets' && offerAvailability[String(id)]?.is_sold_out
                          ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-transparent border-sky-600 text-sky-600 hover:bg-sky-700 hover:border-sky-700 hover:text-white'
                        }`}
                    >
                      {isOffer && String(item?.rule_type || '').toLowerCase() === 'first_n_tickets' && offerAvailability[String(id)]?.is_sold_out
                        ? 'Sold Out'
                        : isSelected ? 'Selected' : isOffer ? 'Claim' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)] gap-6 items-start">
      {/* left: product list */}
      <div className="space-y-4">
        {/* quick date row */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-2 scrollbar-hide whitespace-nowrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">Date</span>
          <button
            type="button"
            onClick={handleToday}
            disabled={todayBlocked}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${todayBlocked
              ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
              : sel.date === todayYMD()
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleTomorrow}
            disabled={tomorrowBlocked}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${tomorrowBlocked
              ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
              : sel.date === dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={onCalendarButtonClick}
            ref={setCalendarAnchor}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 shrink-0 ${sel.date &&
              sel.date !== '' &&
              sel.date !== todayYMD() &&
              sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            <Calendar size={14} />
            {sel.date && sel.date !== todayYMD() && sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? formatDateDisplay(sel.date)
              : 'More Dates'}
          </button>
        </div>

        <ProductList />
      </div>

      {/* right: order details */}
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

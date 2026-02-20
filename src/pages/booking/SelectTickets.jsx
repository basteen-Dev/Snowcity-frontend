import React, { useMemo } from 'react';
import { ShoppingBag, ChevronRight, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import OrderDetailsBox from './OrderDetailsBox';


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
}) {
  const ProductList = () => {
    const activeTab = sel.itemType;
    const data = useMemo(() => {
      if (activeTab !== 'attraction') return combos;
      return prioritizedAttractions;
    }, [activeTab, prioritizedAttractions, combos]);

    return (
      <div className="space-y-4">
        {/* Toggle */}
        <div className="mb-2">
          <div className="bg-sky-50 p-1 rounded-xl inline-flex border border-sky-100">
            {['attraction', 'combo'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSel((prev) => ({
                    ...prev,
                    itemType: t,
                    attractionId: '',
                    comboId: '',
                    slotKey: '',
                  }));
                }}
                className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${sel.itemType === t
                  ? 'bg-white text-sky-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t === 'attraction' ? 'Attractions' : 'Combos'}
              </button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            {sel.itemType === 'combo' ? 'No combos available' : 'No attractions available'}
          </div>
        ) : (
          data.map((item) => {
            const id = sel.itemType === 'attraction' ? getAttrId(item) : getComboId(item);
            const isSelected =
              String(sel.itemType === 'attraction' ? sel.attractionId : sel.comboId) === String(id);

            const basePrice =
              sel.itemType === 'combo'
                ? Number(getComboDisplayPrice(item) || 0)
                : Number(getPrice(item) || item.price || item.base_price || item.amount || 0);

            const title = sel.itemType === 'attraction' ? item.title || item.name : getComboLabel(item);

            const image =
              sel.itemType === 'combo' ? getComboPrimaryImage(item) : getAttractionImage(item);

            const onSelect = () => {
              const isCombo = sel.itemType === 'combo';
              const existing = cartItems.find((ci) =>
                isCombo
                  ? ci.item_type === 'Combo' && idsMatch(ci.combo_id, id)
                  : (ci.item_type === 'Attraction' || ci.item_type === undefined) && idsMatch(ci.attraction_id, id)
              );
              if (existing) {
                onEditCartItem(existing);
                return;
              }

              setSel((prev) => ({
                ...prev,
                itemType: sel.itemType,
                attractionId: sel.itemType === 'attraction' ? String(id) : '',
                comboId: sel.itemType === 'combo' ? String(id) : '',
                slotKey: '',
              }));
              setDrawerMode('booking');
              setDrawerOpen(true);
            };

            return (
              <div
                key={id}
                className={`bg-white rounded-3xl shadow-sm border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 transition-all ${isSelected ? 'border-sky-400 shadow-md' : 'border-gray-100 hover:border-sky-200'
                  }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gray-100 bg-sky-50 shrink-0">
                    {image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400">
                        <ShoppingBag />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Great for families • Flexible slots • Instant confirmation
                    </p>
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
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:gap-3">
                  <div className="text-right text-xs text-gray-500 uppercase tracking-wide">From</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-bold text-sky-700 tabular-nums">
                      ₹{basePrice || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onSelect}
                    className={`px-6 py-2 rounded-full text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all ${isSelected ? 'bg-sky-700' : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
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
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <button
            type="button"
            onClick={handleToday}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${sel.date === todayYMD()
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
              }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleTomorrow}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${sel.date === dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
              }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={onCalendarButtonClick}
            ref={setCalendarAnchor}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${sel.date &&
              sel.date !== '' &&
              sel.date !== todayYMD() &&
              sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
              }`}
          >
            {sel.date && sel.date !== todayYMD() && sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? formatDateDisplay(sel.date)
              : 'All Days'}
          </button>
          <span className="text-xs sm:text-sm text-gray-500 ml-1">Change date/time in details panel</span>
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
      />
    </div>
  );
}

import React, { useMemo } from 'react';
import { ShoppingBag, ChevronRight, ArrowRight, Calendar } from 'lucide-react';
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
  cartAddons,
  setEditingKey,
}) {
  const [expandedCardId, setExpandedCardId] = React.useState(null);

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
            {['combo','attraction'].map((t) => (
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
              // Reset editing key since we are selecting a NEW item from the gallery
              if (typeof setEditingKey === 'function') setEditingKey(null);

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
                    <div className="text-xs text-gray-500 mt-1">
                      <div className={expandedCardId === id ? "" : "line-clamp-1 break-words"}>
                        {(item.short_description || item.subtitle || 'Instant confirmation • Best experience').replace(/<[^>]*>/g, '')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(expandedCardId === id ? null : id)}
                        className="text-sky-600 font-semibold hover:underline mt-1"
                      >
                        {expandedCardId === id ? 'show less' : 'read more'}
                      </button>
                    </div>
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
                    className={`px-6 py-2 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-all border ${isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-transparent border-sky-600 text-sky-600 hover:bg-sky-700 hover:border-sky-700 hover:text-white'
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
          <span className="text-sm font-semibold text-gray-700 mr-1">Date</span>
          <button
            type="button"
            onClick={handleToday}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${sel.date === todayYMD()
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleTomorrow}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${sel.date === dayjs().add(1, 'day').format('YYYY-MM-DD')
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
          >
            Tomorrow
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCalendarButtonClick}
              ref={setCalendarAnchor}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${sel.date &&
                sel.date !== '' &&
                sel.date !== todayYMD() &&
                sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300 hover:text-sky-600'
                }`}
            >
              {sel.date && sel.date !== todayYMD() && sel.date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                ? formatDateDisplay(sel.date)
                : 'More Dates'}
            </button>
            <button
              type="button"
              onClick={onCalendarButtonClick}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors bg-white shadow-sm"
              title="Open Calendar"
            >
              <Calendar size={18} />
            </button>
          </div>
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

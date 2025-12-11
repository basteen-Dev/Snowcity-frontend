import React from 'react';
import { Sparkles } from 'lucide-react';

const defaultOffers = [
  {
    id: 'default-wed',
    icon: '🎉',
    label: 'Wednesday Special',
    badge: '20% OFF',
    description: 'All attractions the entire day'
  },
  {
    id: 'default-happy',
    icon: '⚡',
    label: 'Happy Hours',
    badge: 'BOGO',
    description: '2PM-4PM buy 1 get 1 free'
  },
  {
    id: 'default-birthday',
    icon: '🎂',
    label: 'Birthday Treat',
    badge: 'Free Entry',
    description: 'Birthday kid gets free access'
  }
];

const normalizePromo = (item, idx) => {
  if (!item) return null;
  if (typeof item === 'string') {
    return {
      id: `promo-string-${idx}`,
      icon: '•',
      label: item,
      badge: null,
      description: null
    };
  }
  return {
    id: item.id || `promo-${idx}`,
    icon: item.icon || '•',
    label: item.label || 'Special Offer',
    badge: item.badge || null,
    description: item.description || null
  };
};

export default function OffersMarquee({ items }) {
  const promos = React.useMemo(() => {
    const src = Array.isArray(items) && items.length ? items : defaultOffers;
    const mapped = src
      .map((item, idx) => normalizePromo(item, idx))
      .filter(Boolean);
    return [...mapped, ...mapped];
  }, [items]);

  return (
    <section className="relative bg-gradient-to-r from-white via-sky-50 to-cyan-50 py-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2 px-4 text-sky-900 font-bold tracking-wide">
        <Sparkles className="w-5 h-5 text-sky-600" />
        <span className="text-sky-800">SPECIAL OFFERS</span>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex whitespace-nowrap animate-offers-marquee">
          {promos.map((promo, idx) => (
            <div
              key={`${promo.id}-${idx}`}
              className="inline-flex items-center mx-6 px-4 py-2 bg-white/80 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-lg text-sky-900"
            >
              <span className="text-xl mr-3">{promo.icon}</span>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-sky-900">{promo.label}</span>
                  {promo.badge ? (
                    <span className="text-[11px] uppercase font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-300">
                      {promo.badge}
                    </span>
                  ) : null}
                </div>
                {promo.description ? (
                  <span className="text-xs text-sky-700 mt-0.5">
                    {promo.description}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes offersMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-offers-marquee {
          animation: offersMarquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}

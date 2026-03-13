import React from 'react';
import { Sparkles } from 'lucide-react';

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
    const src = Array.isArray(items) && items.length ? items : [];
    const mapped = src
      .map((item, idx) => normalizePromo(item, idx))
      .filter(Boolean);
    return mapped.length ? [...mapped, ...mapped] : [];
  }, [items]);

  return (
    <section className="relative bg-[#0099FF] py-3 overflow-hidden">

      <div className="relative flex overflow-hidden">
        <div className="flex whitespace-nowrap animate-offers-marquee">
          {[...promos, ...promos, ...promos].map((promo, idx) => (
            <div
              key={`${promo.id}-${idx}`}
              className="inline-flex items-center mx-6 text-white"
            >
              <span className="text-xl mr-3">{promo.icon}</span>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-sm sm:text-base text-white"
                    dangerouslySetInnerHTML={{ __html: promo.label }}
                  />
                  {promo.badge ? (
                    <span className="text-[11px] uppercase font-bold bg-white/20 text-white px-2 py-0.5 rounded-xl border border-white/30 backdrop-blur-sm">
                      {promo.badge}
                    </span>
                  ) : null}
                </div>
                {promo.description ? (
                  <span className="text-xs text-white mt-0.5">
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
          100% { transform: translateX(-33.33%); }
        }
        .animate-offers-marquee {
          animation: offersMarquee 35s linear infinite;
        }
        .animate-offers-marquee p {
          margin: 0 !important;
          display: inline !important;
        }
      `}</style>
    </section>
  );
}

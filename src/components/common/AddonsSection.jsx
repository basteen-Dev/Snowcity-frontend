import React from 'react';
import { motion } from 'motion/react';
import { formatCurrency } from '../../utils/formatters';
import { imgSrc } from '../../utils/media';

const getAddonTitle = (addon, idx) => addon?.name || addon?.title || addon?.label || `Addon #${idx + 1}`;
const getAddonImage = (addon) => addon?.image_url || addon?.image || addon?.media_url || addon?.avatar || null;
const getAddonPriceLabel = (addon) => {
  const rawPrice = addon?.price ?? addon?.amount ?? addon?.discounted_price;
  if (rawPrice === null || rawPrice === undefined) return null;
  const num = Number(rawPrice);
  if (Number.isNaN(num)) return String(rawPrice);
  return formatCurrency(num);
};

export default function AddonsSection({ items = [], onSelectAddon }) {
  if (!items || !items.length) return null;

  // duplicate items for seamless marquee
  const displayItems = [...items, ...items];

  return (
    <section id="addons" className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-8 px-2 md:py-16 md:px-4">
      <style>{`\n        @keyframes marquee-rtl {\n          0% { transform: translateX(0%); }\n          100% { transform: translateX(-50%); }\n        }\n        .marquee-rtl {\n          animation: marquee-rtl 20s linear infinite;\n        }\n        .marquee-rtl:hover, .marquee-rtl:active { animation-play-state: paused; }\n        @media (max-width: 640px) {\n          .marquee-rtl { animation-duration: 12s; }\n        }\n      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto max-w-6xl px-4"
      >
        <div className="text-center mb-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-blue-400/70">ADD-ONS</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">Enhance Your Visit</h2>
          <p className="mt-2 text-sm text-slate-500">Add these extras to make your experience even more memorable</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="marquee-rtl flex items-center gap-4"
              role="list"
              aria-label="Add-ons marquee"
            >
              {displayItems.map((addon, idx) => {
                const key = addon?.addon_id || addon?.id || idx;
                const title = getAddonTitle(addon, idx);
                // Resolve image using project's helper to support media ids, JSON or relative paths
                const img = imgSrc(addon) || imgSrc(getAddonImage(addon));
                const priceLabel = getAddonPriceLabel(addon);

                return (
                  <motion.button
                    key={key}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectAddon && onSelectAddon(addon)}
                    className="flex-shrink-0 w-40 md:w-48 lg:w-56 h-20 md:h-24 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 px-3 md:px-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-lg overflow-hidden">
                      {img ? (
                        <img src={img} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xl">🎁</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-semibold text-slate-900 line-clamp-1">{title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{priceLabel || 'Included'}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
            <h3 className="text-lg md:text-xl font-bold">💡 Pro Tip!</h3>
            <p className="mt-1 text-sm md:text-base text-white/90">Add these extras during booking to unlock the best bundled pricing and priority access perks.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

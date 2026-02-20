import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice, getBasePrice, getUnitLabel, getDiscountPercent } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

export default function OfferCard({ item }) {
  const title = item?.name || item?.title || 'Offer';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/offer/640/400');

  const price = getPrice(item);
  const basePrice = getBasePrice(item);
  const hasSale = basePrice > 0 && price > 0 && price < basePrice;
  const discountPercent = hasSale ? Math.round(getDiscountPercent(item) || ((basePrice - price) / basePrice) * 100) : 0;
  const unit = getUnitLabel(item);

  const attractionId = item?.attraction_id || item?.attraction?.id || null;
  const bookHref = attractionId ? `/booking?attraction_id=${attractionId}` : null;

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="
        group relative h-[420px] w-full overflow-hidden rounded-2xl
        bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        transition-all duration-300 hover:-translate-y-1
      "
    >
      {/* Image */}
      <img
        src={img}
        alt={item?.image_alt || title}
        className="
          absolute inset-0 h-full w-full object-cover
          transition-transform duration-700 group-hover:scale-110
        "
        loading="lazy"
        decoding="async"
      />

      {/* Offer tag */}
      <span
        className="
          absolute top-4 left-4 z-10 rounded-full bg-white/85 px-4 py-1
          text-xs font-semibold text-slate-900 backdrop-blur
        "
      >
        Offer
      </span>

      {/* Price badge */}
      {price > 0 ? (
        <div className="absolute top-4 right-4 z-10 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-semibold text-white">
          {formatCurrency(price)}
          {hasSale ? <span className="ml-1 text-sky-200">-{discountPercent}%</span> : null}
        </div>
      ) : null}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 z-10 w-full px-5 pb-5 text-white">
        <h3 className="text-xl font-semibold leading-tight line-clamp-2">{title}</h3>

        {desc ? <p className="mt-1 text-sm text-white/80 line-clamp-2">{desc}</p> : null}

        {price > 0 ? (
          <div className="mt-2 text-xs text-white/70">
            {hasSale ? (
              <span className="font-semibold text-emerald-200">Save {discountPercent}%</span>
            ) : (
              <span>{unit}</span>
            )}
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-center">
          <Link
            to={bookHref || '/offers'}
            onClick={stop}
            className="
              rounded-full bg-[#003de6] px-8 py-2.5
              text-sm font-bold text-white
              shadow-lg transition-all
              hover:bg-[#002db3]
            "
          >
            {bookHref ? 'Book Now' : 'View Offers'}
          </Link>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/formatters';
import { getPrice, getBasePrice, getUnitLabel, getDiscountPercent } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

export default function OfferCard({ item }) {
  const title = item?.name || item?.title || 'Offer';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item);

  const price = getPrice(item);
  const basePrice = getBasePrice(item);
  const hasSale = basePrice > 0 && price > 0 && price < basePrice;
  const discountPercent = hasSale ? Math.round(getDiscountPercent(item) || ((basePrice - price) / basePrice) * 100) : 0;
  const unit = getUnitLabel(item);

  const firstRule = Array.isArray(item?.rules) ? item.rules[0] : null;
  const targetId = firstRule?.target_id || null;
  const targetType = firstRule?.target_type || null;

  const attractionId = item?.attraction_id || item?.attraction?.id || (targetType === 'attraction' ? targetId : null);
  const comboId = item?.combo_id || item?.combo?.id || (targetType === 'combo' ? targetId : null);
  const slug = firstRule?.attraction_slug || firstRule?.combo_slug || null;

  const getOfferDate = () => {
    const rules = Array.isArray(item?.rules) ? item.rules : [];
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');

    // Find first rule that suggests a day or date
    for (const rule of rules) {
      if (rule.rule_day) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayIndex = days.indexOf(rule.rule_day);
        if (targetDayIndex !== -1) {
          let diff = targetDayIndex - today.day();
          if (diff < 0) diff += 7; // Allow today if it's the correct day
          return today.add(diff, 'day').format('YYYY-MM-DD');
        }
      }
      if (rule.valid_from) {
        const vf = dayjs(rule.valid_from).format('YYYY-MM-DD');
        if (vf >= todayStr) return vf;
      }
    }
    return today.format('YYYY-MM-DD'); // Default to today
  };

  // Slug is already extracted above
  const offerDate = getOfferDate();
  const params = new URLSearchParams();
  if (params.size === 0) { // Just for building params cleanly
    params.set('date', offerDate);
    params.set('openDrawer', 'true');
  }

  const bookHref = slug
    ? `/${slug}?${params.toString()}`
    : attractionId
      ? `/tickets-offers?attraction_id=${attractionId}&${params.toString()}`
      : comboId
        ? `/tickets-offers?combo_id=${comboId}&${params.toString()}`
        : null;

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="
        group relative h-[420px] w-full overflow-hidden rounded-xl
        bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        transition-all duration-300 hover:-translate-y-1
      "
    >
      {/* Image */}
      <img
        src={img}
        alt={item?.image_alt || title}
        width={640}
        height={400}
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
          absolute top-4 left-4 z-10 rounded-xl bg-white/85 px-4 py-1
          text-xs font-semibold text-slate-900 backdrop-blur
        "
      >
        Offer
      </span>

      {/* Price badge */}
      {price > 0 ? (
        <div className="absolute top-4 right-4 z-10 rounded-xl bg-sky-400 px-4 py-1.5 text-xs font-semibold text-white">
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
              rounded-xl bg-[#003de6] px-8 py-2.5
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
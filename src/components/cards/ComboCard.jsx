import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

const IMAGE_PLACEHOLDER = (seed = 'combo') => `https://picsum.photos/seed/${seed}/640/400`;

const pickImage = (src, seed = 'combo') =>
  imgSrc(typeof src === 'string' && src ? src : IMAGE_PLACEHOLDER(seed));

const resolveImageSource = (value) => {
  if (!value && value !== 0) return '';
  const src = imgSrc(value, '') || '';
  return src;
};

const getComboPrimaryImage = (combo) => {
  if (!combo) return '';
  const candidates = [
    combo.hero_image,
    combo.banner_image,
    combo.image_web,
    combo.image_mobile,
    combo.image_url,
    combo.cover_image,
    combo.poster_image,
    combo.thumbnail,
    combo.banner_media_id,
    combo.image_media_id,
    combo.cover_media_id,
    Array.isArray(combo.media) ? combo.media[0] : null,
    Array.isArray(combo.gallery) ? combo.gallery[0] : null,
    combo.image
  ];
  for (const candidate of candidates) {
    const src = resolveImageSource(candidate);
    if (src) return src;
  }
  return '';
};

const getComboPreviewImages = (combo, fallbacks = []) => {
  const images = [];
  const seen = new Set();
  const push = (candidate) => {
    const src = resolveImageSource(candidate);
    if (src && !seen.has(src)) {
      seen.add(src);
      images.push(src);
    }
  };

  if (combo) {
    const explicit = [
      combo.attraction_1?.image_url,
      combo.attraction_1_image,
      combo.attraction_1?.cover_image,
      combo.attraction_2?.image_url,
      combo.attraction_2_image,
      combo.attraction_2?.cover_image,
      combo.attraction_1?.media?.[0],
      combo.attraction_2?.media?.[0]
    ];
    explicit.forEach(push);

    if (Array.isArray(combo.media)) combo.media.forEach(push);
    if (Array.isArray(combo.gallery)) combo.gallery.forEach(push);
  }

  fallbacks.forEach(push);

  return images.slice(0, 2);
};

const normalizeAttraction = (raw, fallbackTitle = 'Attraction', seed = 'combo-attraction') => {
  if (!raw || typeof raw !== 'object') {
    return {
      title: fallbackTitle,
      image_url: IMAGE_PLACEHOLDER(seed),
      slug: null,
      price: 0,
      href: null,
    };
  }

  const title = raw.title || raw.name || fallbackTitle;
  const slug = raw.slug || raw.id || raw.attraction_id || null;
  const price = Number(raw.base_price || raw.price || raw.amount || 0);
  const image = pickImage(raw.image_url || raw.cover_image || raw.image, seed);

  return {
    title,
    image_url: image,
    slug,
    price,
    href: slug ? `/attractions/${slug}` : null,
  };
};

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const computeBaseSum = (combo) => {
  if (!combo || typeof combo !== 'object') return 0;

  const total = toAmount(combo.total_price);
  if (total > 0) return total;

  if (Array.isArray(combo.attractions) && combo.attractions.length) {
    const sum = combo.attractions.reduce(
      (acc, attr) => acc + toAmount(attr?.price ?? attr?.base_price ?? attr?.amount),
      0
    );
    if (sum > 0) return sum;
  }

  if (Array.isArray(combo.combo_attractions) && combo.combo_attractions.length) {
    const sum = combo.combo_attractions.reduce(
      (acc, attr) => acc + toAmount(attr?.attraction_price ?? attr?.price),
      0
    );
    if (sum > 0) return sum;
  }

  const attractionPrices = combo.attraction_prices;
  if (Array.isArray(attractionPrices) && attractionPrices.length) {
    const sum = attractionPrices.reduce((acc, value) => acc + toAmount(value), 0);
    if (sum > 0) return sum;
  } else if (attractionPrices && typeof attractionPrices === 'object') {
    const values = Object.values(attractionPrices);
    const sum = values.reduce((acc, value) => acc + toAmount(value), 0);
    if (sum > 0) return sum;
  }

  const legacySum =
    toAmount(combo?.attraction_1_price) +
    toAmount(combo?.attraction_2_price);
  if (legacySum > 0) return legacySum;

  return 0;
};

export default function ComboCard({ item }) {
  const title = item?.name || item?.title || 'Combo deal';
  const desc = item?.short_description || item?.subtitle || '';
  const comboId = item?.combo_id || item?.id || item?.slug || null;

  const leftSeed = comboId
    ? `combo-${comboId}-left`
    : `combo-left-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const rightSeed = comboId
    ? `combo-${comboId}-right`
    : `combo-right-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const left = normalizeAttraction(
    item?.attraction_1 || {
      title: item?.attraction_1_title,
      image_url: item?.attraction_1_image,
      slug: item?.attraction_1_slug,
      base_price: item?.attraction_1_price,
    },
    'Experience A',
    leftSeed
  );

  const right = normalizeAttraction(
    item?.attraction_2 || {
      title: item?.attraction_2_title,
      image_url: item?.attraction_2_image,
      slug: item?.attraction_2_slug,
      base_price: item?.attraction_2_price,
    },
    'Experience B',
    rightSeed
  );

  const heroImage = getComboPrimaryImage(item);
  const splitImages = getComboPreviewImages(item, [left.image_url, right.image_url]);

  const price = getPrice(item, { includeOffers: false });
  const baseSum = computeBaseSum(item);
  const comboDisplayPrice = price > 0 ? price : (toAmount(item?.combo_price) || toAmount(item?.total_price) || baseSum);
  const hasBase = baseSum > 0;
  const discountPercent =
    hasBase && comboDisplayPrice > 0 ? Math.max(0, Math.round((1 - comboDisplayPrice / baseSum) * 100))
      : Number(item?.discount_percent || 0);

  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/booking?combo_id=${numericComboId}&openDrawer=true` : '/booking?openDrawer=true';

  return (
    <div
      className="
        group relative flex flex-col rounded-2xl bg-white/90 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 focus:outline-none
      "
    >
      <div className="relative aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden">

        {heroImage ? (
          <div className="relative h-full w-full overflow-hidden group">
            <img
              src={heroImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col gap-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-200">Includes</p>
              <div className="text-sm font-semibold text-white flex flex-wrap items-center gap-2">
                <span>{left.title}</span>
                <span className="opacity-70">+</span>
                <span>{right.title}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 h-full gap-0.5 md:gap-1">
            <div className="relative h-full w-full overflow-hidden group animate-left-in">
              <img
                src={splitImages[0] || left.image_url}
                alt={left.title}
                className="
                  h-full w-full object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.08]
                  group-hover:brightness-110
                "
                loading="lazy"
              />
              <div className="
                absolute inset-x-0 bottom-0 
                bg-gradient-to-t from-black/75 via-black/20 to-transparent
                p-3 backdrop-blur-[2px]
              ">
                <p className="text-[11px] tracking-wide text-gray-200">Experience 1</p>
                <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                  {left.title}
                </h4>
              </div>
            </div>

            <div className="relative h-full w-full overflow-hidden group animate-right-in">
              <img
                src={splitImages[1] || right.image_url}
                alt={right.title}
                className="
                  h-full w-full object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.08]
                  group-hover:brightness-110
                "
                loading="lazy"
              />
              <div className="
                absolute inset-x-0 bottom-0 
                bg-gradient-to-t from-black/75 via-black/20 to-transparent
                p-3 backdrop-blur-[2px]
              ">
                <p className="text-[11px] tracking-wide text-gray-200">Experience 2</p>
                <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                  {right.title}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Plus icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="
              h-10 w-10 rounded-full bg-white/90 text-indigo-700
              text-lg font-bold shadow border flex items-center justify-center
            "
          >
            +
          </span>
        </div>

        {/* Combo tag */}
        <span
          className="
            absolute top-2 left-2 px-2 py-1
            bg-emerald-600 text-white text-[11px] rounded-full shadow
          "
        >
          Combo
        </span>

        {/* Price */}
        {comboDisplayPrice > 0 && (
          <div
            className="
              absolute bottom-2 left-2 px-3 py-1
              rounded-full bg-black/70 backdrop-blur-md
              text-white text-xs shadow
            "
          >
            <span className="font-semibold">{formatCurrency(comboDisplayPrice)}</span>
            <span className="opacity-80"> per combo</span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 tracking-tight">
          {title}
        </h3>

        {desc ? <p className="text-sm text-gray-600 mt-1 line-clamp-2">{desc}</p> : null}

        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
          <span>{left.title}</span>
          <span>+</span>
          <span>{right.title}</span>
        </div>

        {hasBase && (
          <div className="mt-2 flex items-baseline gap-2 text-sm">
            <div className="line-through text-gray-400">{formatCurrency(baseSum)}</div>
            <div className="text-green-700 font-semibold">
              {discountPercent > 0 ? `Save ${discountPercent}%` : 'Combo pricing'}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-3 flex items-center gap-3">
          <Link
            to={comboId ? `/combos/${comboId}` : '/combos'}
            className="text-sm text-blue-600 font-medium hover:text-blue-800 transition"
          >
            View Combo →
          </Link>

          <Link
            to={bookHref}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-600 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-sky-900/15 hover:bg-sky-700 transition-all duration-200"
          >
            🎟 Book Now
          </Link>
        </div>

        {/* Extra links */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-600 font-medium">
          {left.href ? (
            <Link to={left.href} className="hover:underline">View {left.title}</Link>
          ) : null}
          {right.href ? (
            <Link to={right.href} className="hover:underline">View {right.title}</Link>
          ) : null}
        </div>
      </div>

      {/* ANIMATIONS — DO NOT TOUCH LOGIC */}
      <style>{`
        @keyframes leftFullIn {
          0% { opacity: 0; transform: translateX(-120vw) rotate(-45deg); }
          80% { opacity: 1; transform: translateX(12px) rotate(-5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-left-in {
          animation: leftFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }

        @keyframes rightFullIn {
          0% { opacity: 0; transform: translateX(120vw) rotate(45deg); }
          80% { opacity: 1; transform: translateX(-12px) rotate(5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-right-in {
          animation: rightFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }
      `}</style>
    </div>
  );
}
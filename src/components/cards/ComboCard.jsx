import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';
import { Info } from 'lucide-react';

const IMAGE_PLACEHOLDER = (seed = 'combo') => `https://picsum.photos/seed/${seed}/640/400`;

const pickImage = (src, seed = 'combo') =>
  imgSrc(typeof src === 'string' && src ? src : IMAGE_PLACEHOLDER(seed));

const generateComboSlug = (combo) => {
  if (combo.slug) return combo.slug;
  if (Array.isArray(combo.attractions) && combo.attractions.length) {
    const slugs = combo.attractions.map(a => a.slug).filter(Boolean);
    if (slugs.length) return slugs.join('-');
  }
  return null;
};

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

const ComboCardInner = function ComboCard({ item, isUltimate = false }) {
  const title = item?.name || item?.title || 'Combo deal';
  const desc = item?.short_description || item?.subtitle || '';
  const comboId = item?.combo_id || item?.id || item?.slug || null;

  const heroImage = getComboPrimaryImage(item);
  const price = getPrice(item, { includeOffers: false });
  const baseSum = computeBaseSum(item);
  const comboDisplayPrice = price > 0 ? price : (toAmount(item?.combo_price) || toAmount(item?.total_price) || baseSum);

  const comboSlug = generateComboSlug(item);
  const rawSlug = comboSlug?.startsWith('combo-') ? comboSlug.slice(6) : comboSlug;
  const comboHref = rawSlug ? `/combo-${rawSlug}` : (comboId ? `/combos/${comboId}` : '/combos');

  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/tickets-offers?combo_id=${numericComboId}&type=combo&openDrawer=true` : '/tickets-offers?type=combo&openDrawer=true';

  const navigate = useNavigate();
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const attractions = item?.attractions || item?.combo_attractions || [];
  const attractionImages = attractions.slice(0, 3).map(a => getComboPrimaryImage(a) || IMAGE_PLACEHOLDER(a?.name || 'attr'));

  if (isUltimate) {
    return (
      <div
        onClick={() => navigate(comboHref)}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1a33] via-[#123a63] to-[#0b1a33] p-1 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-blue-500/20 cursor-pointer lg:h-[380px]"
        role="button"
        tabIndex={0}
      >
        <div className="relative flex flex-col lg:flex-row h-full w-full overflow-hidden rounded-xl bg-[#0b1a33]/40 backdrop-blur-xl">
          {/* Combo Hero Image */}
          <div className="relative w-full lg:w-2/4 md:w-2/6 overflow-hidden m:h-[150px] flex items-center bg-[#040e21] min-h-[150px] sm:min-h-[300px] lg:min-h-0">
            {heroImage ? (
              <img
                src={heroImage}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full min-h-[220px] bg-slate-800" />
            )}
          </div>

          {/* Content Area */}
          <div className="flex flex-1 flex-col justify-center p-6 lg:p-10">
            <div className="mb-2 lg:mb-3 inline-flex items-center gap-2">
              <span className="rounded-full bg-sky-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 border border-sky-500/30">
                Summer Combo
              </span>
            </div>

            <h3 className="mb-2 lg:mb-3 text-2xl lg:text-4xl font-black text-white leading-tight">
              {title}
            </h3>

            <p className="mb-4 lg:mb-6 text-sm lg:text-base text-slate-300 line-clamp-2 max-w-xl">
              {desc}
            </p>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-8 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-sky-400">FROM / PER PERSON</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl lg:text-5xl font-black text-white">{formatCurrency(comboDisplayPrice || 1499)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    stop(e);
                    sessionStorage.removeItem('snowcity_booking_state');
                    navigate(bookHref);
                  }}
                  className="rounded-2xl bg-white px-8 lg:px-12 py-4 text-sm lg:text-base font-black uppercase tracking-widest text-[#0099ff] transition-all hover:bg-sky-50 hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                >
                  Book Exclusive Pass
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-sky-600/10 blur-[100px]" />
        </div>
      </div>
    );
  }

  return (
    
    <div
      onClick={() => navigate(comboHref)}
      className="exp-card-new block no-underline cursor-pointer rounded-xl group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(comboHref);
        }
      }}
    >
      <div className="exp-card-visual overflow-hidden">
        {heroImage && (
          <img
            src={heroImage}
            alt={item?.image_alt || title}
            className="absolute inset-0 h-full w-full object-cover  transition-transform duration-500 group-hover:scale-110"
            width={640}
            height={400}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="exp-card-body">
        <div className="exp-type">Exclusive Combo</div>
        <div className="exp-name">{title}</div>


        <div className="flex gap-3 mb-6">
          <div className="exp-desc line-clamp-2">{desc}</div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-1">FROM / PER PERSON</p>
            <p className="text-xl font-extrabold text-[#111827]">{formatCurrency(comboDisplayPrice || 1299)}</p>
          </div>
          <div
            onClick={(e) => {
              stop(e);
              sessionStorage.removeItem('snowcity_booking_state');
              navigate(bookHref);
            }}
            className={`btn-book-exp !py-2.5 !px-6 !text-xs cursor-pointer ${(title.toLowerCase().includes('exclusive summer combo')) ? '!bg-white !text-[#0099ff]' : ''}`}
          >
            Book Now
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ComboCardInner);
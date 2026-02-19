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

export default function ComboCard({ item }) {
  const title = item?.name || item?.title || 'Combo deal';
  const desc = item?.short_description || item?.subtitle || '';
  const comboId = item?.combo_id || item?.id || item?.slug || null;

  const heroImage = getComboPrimaryImage(item);
  const price = getPrice(item, { includeOffers: false });
  const baseSum = computeBaseSum(item);
  const comboDisplayPrice = price > 0 ? price : (toAmount(item?.combo_price) || toAmount(item?.total_price) || baseSum);

  const comboSlug = generateComboSlug(item);
  const comboHref = comboSlug ? `/combo-${comboSlug}` : (comboId ? `/combos/${comboId}` : '/combos');
  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/booking?combo_id=${numericComboId}&openDrawer=true` : '/booking?openDrawer=true';

  const navigate = useNavigate();
  const stop = (e) => e.stopPropagation();

  return (
    <Link
      to={comboHref}
      className="exp-card block no-underline"
    >
      <div className="exp-card-img">
        {heroImage && (
          <img
            src={heroImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="exp-card-body">
        <div className="exp-type">Exclusive Combo</div>
        <div className="exp-name">{title}</div>
    

        <div className="flex gap-3 mb-6">
          <div className="flex-shrink-0 mt-1">
           
          </div>
          <div className="exp-desc">{desc}</div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Person</p>
            <p className="text-xl font-extrabold text-[#1e3a8a]">{formatCurrency(comboDisplayPrice || 1299)}</p>
          </div>
          <div
            onClick={(e) => {
              stop(e);
              navigate(bookHref);
            }}
            className="btn-book-exp !py-2.5 !px-6 !text-xs cursor-pointer"
          >
            Book Now
          </div>
        </div>
      </div>
    </Link>
  );
}
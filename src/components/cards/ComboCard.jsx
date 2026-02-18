import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { getPrice } from '../../utils/pricing';
import { imgSrc } from '../../utils/media';

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
    href: slug ? `/${slug}` : null,
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

  const comboSlug = generateComboSlug(item);
  const comboHref = comboSlug ? `/combo-${comboSlug}` : (comboId ? `/combos/${comboId}` : '/combos');
  const numericComboId = item?.combo_id || item?.id || null;
  const bookHref = numericComboId ? `/booking?combo_id=${numericComboId}&openDrawer=true` : '/booking?openDrawer=true';

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="exp-card"
      onClick={() => window.location.href = comboHref}
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
        <div className="exp-icon">❄️</div>
      </div>
      <div className="exp-card-body">
        <div className="exp-type">Combo Deal</div>
        <div className="exp-name">{title}</div>
        <div className="exp-desc">{desc}</div>
        <div className="exp-footer">
          <div>
            <div className="exp-price-label">Per Person</div>
            <div className="exp-price">{formatCurrency(comboDisplayPrice || 1299)} <span>onwards</span></div>
          </div>
          <Link
            to={bookHref}
            onClick={stop}
            className="btn-book-exp"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
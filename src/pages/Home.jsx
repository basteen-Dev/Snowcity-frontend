import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchBanners } from '../features/banners/bannersSlice';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchOffers } from '../features/offers/offersSlice';
import { fetchCoupons } from '../features/coupons/couponsSlice';
import { fetchPages } from '../features/pages/pagesSlice';
import { fetchBlogs } from '../features/blogs/blogsSlice';

import HeroCarousel from '../components/hero/HeroCarousel';
import AttractionsCarousel from '../components/carousels/AttractionsCarousel';
import CombosCarousel from '../components/carousels/CombosCarousel';
import OffersMarquee from '../components/common/OffersMarquee';
import PlanVisitSection from '../components/common/PlanVisitSection';
import Testimonials from '../components/common/Testimonials';
import VideoBlock from '../components/common/VideoBlock';
import InstagramFeed from '../components/common/InstagramFeed';
import BlogCard from '../components/cards/BlogCard';
import AttractionCard from '../components/cards/AttractionCard';
import ComboCard from '../components/cards/ComboCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import LazyVisible from '../components/common/LazyVisible';
import SkeletonLoader, {
  SkeletonHeroSection,
  SkeletonCarousel,
  SkeletonSectionHeader,
  SkeletonTestimonial,
  SkeletonMarquee
} from '../components/common/SkeletonLoader';
import { imgSrc } from '../utils/media';

// small helpers for localStorage caching
const CACHE_KEY = 'sc_home_cache_v1';
const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveCache = (patch) => {
  try {
    const prev = loadCache() || {};
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...prev, ...patch, __ts: Date.now() }));
  } catch { }
};

// idle helper
const onIdle = (cb) => {
  if ('requestIdleCallback' in window) {
    // @ts-ignore
    return window.requestIdleCallback(cb, { timeout: 1500 });
  }
  return setTimeout(cb, 300);
};

export default function Home() {
  const dispatch = useDispatch();

  const banners = useSelector((s) => s.banners);
  const attractions = useSelector((s) => s.attractions);
  const combos = useSelector((s) => s.combos);
  const offers = useSelector((s) => s.offers);
  const coupons = useSelector((s) => s.coupons);
  const pages = useSelector((s) => s.pages);
  const blogs = useSelector((s) => s.blogs);

  // provide instant content from cache while Redux fetches in background
  const cacheRef = React.useRef(loadCache());

  // initial fetch (critical first), with conditions
  React.useEffect(() => {
    if (banners.status === 'idle') dispatch(fetchBanners());
    if (attractions.status === 'idle') dispatch(fetchAttractions());

    // prefetch lower-priority when idle
    const id = onIdle(() => {
      if (combos.status === 'idle') dispatch(fetchCombos());
      if (offers.status === 'idle') dispatch(fetchOffers());
      if (coupons.status === 'idle') dispatch(fetchCoupons({ active: true, limit: 100 }));
      if (pages.status === 'idle') dispatch(fetchPages());
      if (blogs.status === 'idle') dispatch(fetchBlogs());
    });
    return () => (typeof id === 'number' ? clearTimeout(id) : window.cancelIdleCallback?.(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // hydrate cache when slices succeed (so next visits are instant)
  React.useEffect(() => {
    if (banners.items?.length) saveCache({ banners: banners.items });
  }, [banners.items]);
  React.useEffect(() => {
    if (attractions.items?.length) saveCache({ attractions: attractions.items });
  }, [attractions.items]);
  React.useEffect(() => {
    if (combos.items?.length) saveCache({ combos: combos.items });
  }, [combos.items]);
  React.useEffect(() => {
    if (offers.items?.length) saveCache({ offers: offers.items });
  }, [offers.items]);
  React.useEffect(() => {
    if (coupons.items?.length) saveCache({ coupons: coupons.items });
  }, [coupons.items]);
  React.useEffect(() => {
    if (pages.items?.length) saveCache({ pages: pages.items });
  }, [pages.items]);
  React.useEffect(() => {
    if (blogs.items?.length) saveCache({ blogs: blogs.items });
  }, [blogs.items]);

  // resolve “display” items (store first, else cached)
  const bannerItems = banners.items?.length ? banners.items : cacheRef.current.banners || [];
  const attractionItems = React.useMemo(() => {
    const items = attractions.items?.length ? attractions.items : cacheRef.current.attractions || [];
    return [...items].sort((a, b) => (a.id || a.attraction_id || 0) - (b.id || b.attraction_id || 0));
  }, [attractions.items, cacheRef.current.attractions]);
  const comboItems = combos.items?.length ? combos.items : cacheRef.current.combos || [];
  const offerItems = offers.items?.length ? offers.items : cacheRef.current.offers || [];
  const couponItems = coupons.items?.length ? coupons.items : cacheRef.current.coupons || [];
  const pageItems = pages.items?.length ? pages.items : cacheRef.current.pages || [];
  const blogItems = blogs.items?.length ? blogs.items : cacheRef.current.blogs || [];

  const marqueeItems = React.useMemo(() => {
    const entries = [];
    if (offerItems?.length) {
      offerItems.forEach((offer) => {
        const label = offer.name || offer.title || `Offer`;
        const discount = offer.discount_percent || offer.discountPercent;
        const short = offer.short_description || offer.subtitle || offer.description || '';
        const value = discount ? `Save ${discount}%` : offer.discount_value ? `Flat ₹${offer.discount_value} off` : '';
        entries.push([label, value, short].filter(Boolean).join(' • '));
      });
    }
    if (couponItems?.length) {
      couponItems.forEach((coupon) => {
        const code = (coupon.code || '').toString().toUpperCase();
        const type = String(coupon.type || '').toLowerCase();
        const value = Number(coupon.value || 0);
        const minAmount = Number(coupon.min_amount || coupon.minAmount || 0);
        const desc = coupon.description || '';
        const discountLabel = type === 'percent' && value > 0
          ? `Save ${value}%`
          : value > 0
            ? `Flat ₹${value} off`
            : '';
        const minText = minAmount > 0 ? `Min spend ₹${minAmount}` : '';
        entries.push([
          code ? `Coupon ${code}` : 'Coupon',
          discountLabel,
          minText,
          desc
        ].filter(Boolean).join(' • '));
      });
    }
    return entries;
  }, [offerItems, couponItems]);

  // brand colors (still used for HeroCarousel waveColor)
  const arcticTop = "#0b1a33";      // deep arctic blue
  const arcticMid = "#123a63";      // mid icy blue
  const arcticBottom = "#eaf6ff";   // near-white icy

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0b1a33] via-[#123a63] to-[#eaf6ff]">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-0">
        {/* Subtle background gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -top-10 right-[-5rem] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-1/2 h-80 w-[36rem] -translate-x-1/2 bg-gradient-to-r from-sky-500/25 via-indigo-500/15 to-purple-500/25 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          {banners.status === 'failed' ? (
            <ErrorState message={banners.error?.message || 'Failed to load banners'} />
          ) : bannerItems.length ? (
            <HeroCarousel banners={bannerItems} waveColor={arcticTop} />
          ) : (
            <SkeletonHeroSection />
          )}
        </div>

        <div id="hero-sentinel" className="absolute bottom-0 left-0 right-0 h-1" />
      </section>

      <main className="bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white">
        {/* Offers Marquee */}
        <LazyVisible minHeight={80} placeholder={<div />}>
          {marqueeItems.length ? <OffersMarquee items={marqueeItems} /> : null}
        </LazyVisible>

        {/* Attractions */}
        <LazyVisible minHeight={420} placeholder={<div className="py-8"><SkeletonCarousel items={3} /></div>}>
          {attractions.status === 'failed' ? (
            <ErrorState message={attractions.error?.message || 'Failed to load attractions'} />
          ) : attractionItems.length ? (
            <AttractionsCarousel items={attractionItems} />
          ) : (
            <SkeletonCarousel items={3} />
          )}
        </LazyVisible>

        {/* Combos */}
        <LazyVisible minHeight={420} placeholder={<div className="py-8"><SkeletonCarousel items={4} /></div>}>
          {comboItems.length > 0 && (
            <CombosCarousel items={comboItems} />
          )}
        </LazyVisible>

        {/* Testimonials */}
        <LazyVisible minHeight={320} placeholder={<div className="py-6"><SkeletonTestimonial /></div>}>
          <Testimonials />
        </LazyVisible>

        {/* BLOGS */}
        <LazyVisible minHeight={420} placeholder={<div className="py-6"><SkeletonSectionHeader /></div>}>
          <section id="blogs" className="bg-white py-20 px-6 md:px-8">
            <div className="max-w-[1400px] mx-auto">
              <div className="text-center mb-16">
                <p className="text-sm font-bold tracking-[0.3em] text-sky-500/70 uppercase">LATEST FROM OUR BLOG</p>
                <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-900">Tips, guides & stories</h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                  Make the most of your SnowCity visit with insider recommendations, planning guides, and event highlights.
                </p>
              </div>

              {blogs.status === 'failed' ? (
                <ErrorState message={blogs.error?.message || 'Failed to load blogs'} />
              ) : blogItems.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogItems.slice(0, 3).map((blog) => (
                    <div key={blog.blog_id ?? blog.id ?? blog.slug} className="group">
                      <BlogCard item={blog} />
                    </div>
                  ))}
                </div>
              ) : (
                <SkeletonCarousel items={3} />
              )}

              <div className="mt-12 text-center">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 px-8 py-3 text-sm font-semibold text-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white"
                >
                  View All Articles
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>
        </LazyVisible>

        {/* Plan Your Visit */}
        <LazyVisible minHeight={320} placeholder={<div className="py-6" />}>
          <PlanVisitSection />
        </LazyVisible>

        {/* Instagram */}
        <LazyVisible minHeight={240} placeholder={<div className="py-6" />}>
          <InstagramFeed />
        </LazyVisible>

        {/* Marquee animation styles */}
        <style>{`
          @keyframes scrollHalf {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee { animation: scrollHalf 18s linear infinite; }
          .marquee:hover { animation-play-state: paused; }
        `}</style>
      </main>
    </div>
  );
}
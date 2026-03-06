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
import { fetchActiveAnnouncements } from '../features/announcements/announcementsSlice';

import HeroCarousel from '../components/hero/HeroCarousel';
import AttractionsCarousel from '../components/carousels/AttractionsCarousel';
import CombosCarousel from '../components/carousels/CombosCarousel';
import OffersMarquee from '../components/common/OffersMarquee';
import PlanVisitSection from '../components/common/PlanVisitSection';
import Testimonials from '../components/common/Testimonials';
import VideoBlock from '../components/common/VideoBlock';
import BlogCard from '../components/cards/BlogCard';
import AttractionCard from '../components/cards/AttractionCard';
import ComboCard from '../components/cards/ComboCard';
import NearbyAttractionSection from '../components/common/Nearbyattractionsection';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import LazyVisible from '../components/common/LazyVisible';
import {
  SkeletonHeroSection,
  SkeletonCarousel,
  SkeletonSectionHeader,
  SkeletonTestimonial,
  SkeletonMarquee
} from '../components/common/SkeletonLoader';
import { imgSrc } from '../utils/media';
import usePageSeo from '../hooks/usePageSeo';

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
  const announcements = useSelector((s) => s.announcements);

  // explicitly manage SEO for the home page
  usePageSeo({
    title: 'SnowCity - Experience Excellence',
    description: 'Visit SnowCity for the ultimate snow experience. Book your tickets now!',
    keywords: 'snowcity, snow park, amusement park, snow',
    type: 'website',
  });

  // initial fetch
  React.useEffect(() => {
    dispatch(fetchBanners());
    dispatch(fetchAttractions());

    // prefetch lower-priority when idle
    const id = onIdle(() => {
      onIdle(() => {
        dispatch(fetchCombos());
        dispatch(fetchOffers());
        dispatch(fetchCoupons({ active: true, limit: 100 }));
        dispatch(fetchPages());
        dispatch(fetchBlogs());
        dispatch(fetchActiveAnnouncements());
      });
    });
    return () => (typeof id === 'number' ? clearTimeout(id) : window.cancelIdleCallback?.(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // item resolvers (Redux slices now handle hydration from localStorage)
  const bannerItems = banners.items || [];
  const attractionItems = React.useMemo(() => {
    return attractions.items || [];
  }, [attractions.items]);
  const comboItems = combos.items || [];
  const offerItems = offers.items || [];
  const couponItems = coupons.items || [];
  const pageItems = pages.items || [];
  const blogItems = blogs.items || [];

  const marqueeItems = React.useMemo(() => {
    const entries = [];

    // 1. Standalone Dedicated Announcements (Priority)
    if (announcements.items?.length) {
      announcements.items.forEach(ann => {
        if (ann.content?.trim()) entries.push(ann.content.trim());
      });
    }

    // 2. Coupons (existing logic)
    if (couponItems?.length) {
      couponItems.forEach((coupon) => {
        const code = (coupon.code || '').toString().toUpperCase();
        const type = String(coupon.type || '').toLowerCase();
        const value = Number(coupon.value || 0);
        const minAmount = Number(coupon.min_amount || coupon.minAmount || 0);
        const desc = coupon.description || '';
        const discountLabel = type === 'percent' && value > 0
          ? `Save ${value}%`
          : type === 'amount' && value > 0
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
  }, [announcements.items, couponItems]);

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
          <div className="absolute -top-32 -left-24 h-64 w-64 rounded-xl bg-cyan-400/20 blur-3xl" />
          <div className="absolute -top-10 right-[-5rem] h-80 w-80 rounded-xl bg-blue-500/20 blur-3xl" />
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

      <main className="bg-gradient-to-b from-[#f5f8ff] to-white">
        {/* Offers Marquee */}
        <LazyVisible minHeight={60} shadow={false}>
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

        {/* Plan Your Visit & FAQ */}
        <LazyVisible minHeight={400} placeholder={<div className="py-10" />}>
          <PlanVisitSection />
        </LazyVisible>

        {/* BLOGS */}
        <LazyVisible minHeight={420} placeholder={<div className="py-6"><SkeletonSectionHeader /></div>}>
          <section id="blogs" className="bg-white py-20 px-4 md:px-4">
            <div className="w-full mx-auto">
              <div className="text-center mb-16">
                <p className="text-sm font-bold tracking-[0.3em] text-sky-500/70 uppercase">LATEST FROM OUR BLOG</p>
                <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-900">Tips, guides & stories</h2>
                <p className="mt-4 text-lg text-gray-600 w-full mx-auto">
                  Make the most of your SnowCity visit with insider recommendations, planning guides, and event highlights.
                </p>
              </div>

              {blogs.status === 'failed' ? (
                <ErrorState message={blogs.error?.message || 'Failed to load blogs'} />
              ) : blogItems.length ? (
                <div className="blog-marquee-wrapper">
                  <div className="blog-marquee grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...blogItems.slice(0, 3), ...blogItems.slice(0, 3)].map((blog, idx) => (
                      <div
                        className={`blog-card-wrap ${idx >= 3 ? 'md:hidden' : ''}`}
                        key={`${blog.blog_id ?? blog.id ?? blog.slug}-${idx}`}
                      >
                        <BlogCard item={blog} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <SkeletonCarousel items={3} />
              )}

              <div className="mt-12 text-center">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-600 px-8 py-3 text-sm font-semibold text-sky-600 transition-all duration-300 hover:bg-sky-600 hover:text-white"
                >
                  View All Articles
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>
        </LazyVisible>

        {/* Nearby Attractions */}
        <LazyVisible minHeight={400} placeholder={<div className="py-10" />}>
          <NearbyAttractionSection />
        </LazyVisible>




        {/* Marquee animation styles */}
        <style>{`
          @keyframes scrollHalf {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee { animation: scrollHalf 18s linear infinite; }
          .marquee:hover { animation-play-state: paused; }

          @media (max-width: 767px) {
            .blog-marquee-wrapper {
              overflow: hidden;
              margin: 0;
              padding: 10px 0;
            }
            .blog-marquee {
              display: flex !important;
              flex-direction: row !important;
              width: max-content;
              gap: 24px !important;
              animation: scrollRTL 40s linear infinite;
              padding: 0 20px;
            }
            .blog-card-wrap {
              width: 300px;
              flex-shrink: 0;
            }
          }

          @keyframes scrollRTL {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </main>
    </div>
  );
}
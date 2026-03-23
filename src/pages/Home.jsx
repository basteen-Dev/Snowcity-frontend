import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchBanners } from '../features/banners/bannersSlice';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchOffers } from '../features/offers/offersSlice';
import { fetchPages } from '../features/pages/pagesSlice';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import { fetchActiveAnnouncements } from '../features/announcements/announcementsSlice';

import HeroCarousel from '../components/hero/HeroCarousel';

const AttractionsCarousel = React.lazy(() => import('../components/carousels/AttractionsCarousel'));
const CombosCarousel = React.lazy(() => import('../components/carousels/CombosCarousel'));
const OffersMarquee = React.lazy(() => import('../components/common/OffersMarquee'));

const PlanVisitSection = React.lazy(() => import('../components/common/PlanVisitSection'));
const Testimonials = React.lazy(() => import('../components/common/Testimonials'));
const VideoBlock = React.lazy(() => import('../components/common/VideoBlock'));
const BlogCard = React.lazy(() => import('../components/cards/BlogCard'));
const AttractionCard = React.lazy(() => import('../components/cards/AttractionCard'));
const ComboCard = React.lazy(() => import('../components/cards/ComboCard'));
const NearbyAttractionSection = React.lazy(() => import('../components/common/Nearbyattractionsection'));
const NavigationAccordion = React.lazy(() => import('../components/common/NavigationAccordion'));
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
  const comboItems = React.useMemo(() => {
    const items = combos.items || [];
    return [...items].sort((a, b) => {
      const idA = String(a.combo_id || a.id || '');
      const idB = String(b.combo_id || b.id || '');
      
      if (idA === '25') return -1;
      if (idB === '25') return 1;
      
      if (idA === '21') return -1;
      if (idB === '21') return 1;
      
      if (idA === '26') return 1;
      if (idB === '26') return -1;
      
      return Number(idB) - Number(idA);
    });
  }, [combos.items]);
  const offerItems = offers.items || [];
  const pageItems = pages.items || [];
  const blogItems = blogs.items || [];
  const blogTopUpdated = React.useMemo(() => {
    if (!blogItems.length) return [];
    const toTime = (blog) => {
      const raw = blog?.updated_at || blog?.published_at || blog?.created_at || blog?.date;
      const time = raw ? new Date(raw).getTime() : 0;
      return Number.isFinite(time) ? time : 0;
    };
    return [...blogItems]
      .sort((a, b) => toTime(b) - toTime(a))
      .slice(0, 3);
  }, [blogItems]);

  const marqueeItems = React.useMemo(() => {
    const entries = [];

    // 1. Standalone Dedicated Announcements (Priority)
    if (announcements.items?.length) {
      announcements.items.forEach(ann => {
        if (ann.content?.trim()) entries.push(ann.content.trim());
      });
    }

    return entries;
  }, [announcements.items]);

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

        <div id="hero-sentinel" className="absolute bottom left-0 right-0 h-1" />
      </section>

      <main className="bg-gradient-to-b from-[#f5f8ff] to-white">
        {/* Offers Marquee */}
        {marqueeItems.length > 0 && <React.Suspense fallback={null}><OffersMarquee items={marqueeItems} /></React.Suspense>}

        {/* Attractions */}
        {attractions.status === 'failed' ? (
          <ErrorState message={attractions.error?.message || 'Failed to load attractions'} />
        ) : attractionItems.length ? (
          <React.Suspense fallback={<div className="py-8"><SkeletonCarousel items={3} /></div>}>
            <AttractionsCarousel items={attractionItems} />
          </React.Suspense>
        ) : (
          <div className="py-8"><SkeletonCarousel items={3} /></div>
        )}

        {/* Combos */}
        {comboItems.length > 0 ? (
          <React.Suspense fallback={<div className="py-8"><SkeletonCarousel items={4} /></div>}>
            <CombosCarousel items={comboItems} />
          </React.Suspense>
        ) : (
          <div className="py-8"><SkeletonCarousel items={4} /></div>
        )}

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
              ) : blogTopUpdated.length ? (
                <div className="blog-marquee-wrapper">
                  <div className="blog-marquee grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogTopUpdated.map((blog, idx) => (
                      <div
                        className="blog-card-wrap"
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

        {/* Navigation Group (Accordion) — lazy loaded */}
        <LazyVisible minHeight={80} placeholder={<div className="py-6" />}>
          <NavigationAccordion />
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
              overflow-x: auto;
              overflow-y: hidden;
              margin: 0;
              padding: 10px 0;
              scroll-snap-type: x mandatory;
              -webkit-overflow-scrolling: touch;
            }
             .blog-marquee {
               display: flex !important;
               flex-direction: row !important;
               width: max-content;
               gap: 24px !important;
               animation: none;
               padding: 0 20px 8px 20px;
              }
            .blog-card-wrap {
              width: 300px;
              flex-shrink: 0;
              scroll-snap-align: start;
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

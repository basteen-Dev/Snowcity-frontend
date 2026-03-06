import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AttractionCard from "../cards/AttractionCard";

export default function AttractionsCarousel({ items = [] }) {
  // Sort items to ensure a consistent experience with priority given to Snow Park and Mad Lab
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const titleA = (a?.title || a?.name || '').toLowerCase();
      const titleB = (b?.title || b?.name || '').toLowerCase();

      const isSnowParkA = titleA.includes('snow park');
      const isSnowParkB = titleB.includes('snow park');
      const isMadLabA = titleA.includes('mad lab');
      const isMadLabB = titleB.includes('mad lab');

      // Rank 1: Snow Park
      if (isSnowParkA && !isSnowParkB) return -1;
      if (!isSnowParkA && isSnowParkB) return 1;

      // Rank 2: Mad Lab
      if (isMadLabA && !isMadLabB) return -1;
      if (!isMadLabA && isMadLabB) return 1;

      // Otherwise maintain ID order
      const idA = a?.attraction_id ?? a?.id ?? 0;
      const idB = b?.attraction_id ?? b?.id ?? 0;
      return idA - idB;
    });
  }, [items]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  // For smooth loop behavior when item count is low relative to slidesPerView
  const displayItems = React.useMemo(() => {
    if (sortedItems.length > 0) {
      // Triplicate to ensure Swiper always has enough slides for a perfect loop/peek
      return [...sortedItems, ...sortedItems, ...sortedItems];
    }
    return sortedItems;
  }, [sortedItems]);

  if (!sortedItems.length) return null;

  const realIndex = activeIndex % sortedItems.length;

  return (
    <section className="relative w-full overflow-hidden pt-20 pb-24 px-4 md:px-4 bg-gradient-to-t from-white via-sky-50 to-white">
      {/* HEADER - MATCHING THE NEW DESIGN */}
      <div className="relative z-10 w-full text-center mb-16">
        <p className="text-xs font-bold tracking-[0.4em] text-blue-600 uppercase mb-4">
          Unforgettable Experiences
        </p>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>
          Every Visit is a Different Adventure
        </h2>
        <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-xl mb-6" />
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          From real snowfall at −7°C to mind-bending illusions, augmented reality and hands-on science — Snow City is Bengaluru's most extraordinary indoor destination.
        </p>
      </div>

      {/* DESKTOP GRID - FEATURED LOGIC */}
      <div className="hidden lg:flex flex-col gap-10 w-full mb-16">
        {/* Featured Row */}
        {sortedItems.length > 0 && (
          <div className="w-full">
            <AttractionCard item={sortedItems[0]} featured={true} />
          </div>
        )}

        {/* Sub Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedItems.slice(1, 4).map((item, idx) => (
            <div key={`${item?.id || item?.attraction_id}-desktop-${idx}`}>
              <AttractionCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE & TABLET SLIDER */}
      <div className="lg:hidden relative z-10 premium-carousel mb-8">
        {/* Row 1: Snow Park Standalone */}
        {sortedItems.length > 0 && (
          <div className="px-2 mb-10">
            <AttractionCard item={sortedItems[0]} />
          </div>
        )}

        {/* Row 2: Remaining Items Auto-sliding */}
        {sortedItems.length > 1 && (
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={16}
            slidesPerView={1.2}
            centeredSlides={false}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            grabCursor={true}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex + 1)} // offset by 1 because of the standalone card
            className="pb-12"
          >
            {sortedItems.slice(1).map((item, idx) => (
              <SwiperSlide key={`${item?.id ?? idx}-mobile-${idx}`} className="h-auto">
                <AttractionCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* CUSTOM PAGINATION DOTS - Reflecting all items */}
        <div className="flex justify-center items-center gap-2 mt-2">
          {sortedItems.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 transition-all duration-300 rounded-xl ${(realIndex === idx || (idx === 0 && activeIndex === 0))
                ? "w-6 bg-blue-600"
                : "w-1.5 bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex justify-center mt-12">
        <Link
          to="/attractions"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-600 px-8 py-3 text-sm font-semibold text-sky-600 transition-all duration-300 hover:bg-sky-600 hover:text-white"
        >
          View All Experiences
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

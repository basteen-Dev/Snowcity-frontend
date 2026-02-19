// import React from "react";
// import { Link } from "react-router-dom";
// import AttractionCard from "../cards/AttractionCard";

// function getUniqueKey(item) {
//   return (
//     item?.attraction_id ??
//     item?.id ??
//     item?.slug ??
//     item?.uuid ??
//     "k-" + Math.random()
//   ).toString();
// }

// function getSortValue(item) {
//   const candidate =
//     item?.attraction_id ??
//     item?.id ??
//     (typeof item?.slug === "string" ? item.slug : null);
//   const asNumber = Number(candidate);
//   if (!Number.isNaN(asNumber) && isFinite(asNumber)) return asNumber;
//   if (candidate != null) return candidate;
//   return Infinity;
// }

// export default function AttractionsCarousel({ items = [] }) {
//   const [index, setIndex] = React.useState(0);

//   const cards = React.useMemo(
//     () =>
//       [...items]
//         .sort((a, b) => {
//           const av = getSortValue(a);
//           const bv = getSortValue(b);
//           if (av === bv) return 0;
//           return av < bv ? -1 : 1;
//         })
//         .map((it) => ({
//           ...it,
//           _key: getUniqueKey(it),
//         })),
//     [items]
//   );

//   const pairCount = Math.ceil(cards.length / 2);

//   React.useEffect(() => {
//     if (window.innerWidth >= 768) return;
//     const timer = setInterval(() => {
//       setIndex((p) => (p + 1) % pairCount);
//     }, 3000);
//     return () => clearInterval(timer);
//   }, [pairCount]);

//   const leftCard = cards[index * 2];
//   const rightCard = cards[index * 2 + 1];
//   const isLastOdd = !rightCard && index === pairCount - 1;

//   return (
//     <section
//       className="
//         relative w-full overflow-hidden py-16
//         bg-gradient-to-b
//         from-[#e0f2fe] via-[#bae6fd] to-white
//       "
//     >
//       {/* floating emojis */}
//       <div className="pointer-events-none absolute inset-0">
//         <span
//           className="absolute top-16 left-8 text-6xl opacity-20 text-blue-400 animate-floatSlow"
//           aria-hidden="true"
//         >
//           ❄️
//         </span>
//         <span
//           className="absolute bottom-20 right-10 text-6xl opacity-20 text-indigo-400 animate-floatFast"
//           aria-hidden="true"
//         >
//           🎢
//         </span>
//       </div>
//       {/* wave divider */}
//       <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-[0] z-0">
//         <svg
//           className="relative block w-[200%] h-[90px] animate-liquidWave"
//           viewBox="0 0 1200 120"
//           preserveAspectRatio="none"
//         >
//           <path
//             d="M321.39 56.44 c58.39 4.09 113.77 22.36 171.23 29.21 c95.25 11.73 191.92-7.88 284.83-25.5 c93.44-17.72 188.32-36.37 285.78-27.95 c66 5.64 128.47 24.69 193.77 39.54V0H0v27.35 c47.72 22.52 103.4 27.88 157.05 29.66 c54.13 1.79 108.29-3.64 164.34-.57z"
//             fill="#e0f2fe"
//             fillOpacity="1"
//           />
//         </svg>
//       </div>

//       {/* HEADER */}
//       <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 md:px-8">
//         <div className="text-center mb-10">
//           <p className="text-xs font-semibold tracking-[0.4em] text-slate-400">DISCOVER</p>
//           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">
//             Attractions
//           </h2>
//           <p className="mt-3 text-sm text-slate-500">
//             Discover our amazing collection of thrilling experiences
//           </p>
//           <div className="mt-4">
//             <Link
//               to="/attractions"
//               className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
//             >
//               View all attractions
//               <span aria-hidden="true">→</span>
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* DESKTOP GRID */}
//       <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-5">
//         <div className="grid md:grid-cols-3 gap-6">
//           {cards.map((item) => (
//             <div
//               key={item._key}
//               className="
//                 rounded-2xl overflow-hidden bg-white
//                 border border-white/40 shadow-md
//                 hover:shadow-xl transition-all duration-300
//                 hover:-translate-y-1 will-change-transform
//               "
//             >
//               <AttractionCard item={item} />
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* MOBILE PAIRED CARDS */}
//       <div className="md:hidden relative z-10 max-w-md mx-auto px-4 mt-2">
//         <div className="flex items-start justify-between gap-3 w-full min-h-[460px] relative overflow-visible">
//           {leftCard && (
//             <div
//               key={leftCard._key + "-L-" + index}
//               className="
//                 w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
//                 border border-white/40 animate-card
//               "
//               style={{ "--x": "-24px" }}
//             >
//               <AttractionCard item={leftCard} />
//             </div>
//           )}

//           {!isLastOdd && rightCard && (
//             <div
//               key={rightCard._key + "-R-" + index}
//               className="
//                 w-[48%] rounded-2xl bg-white shadow-md overflow-hidden
//                 border border-white/40 animate-card
//               "
//               style={{ "--x": "24px" }}
//             >
//               <AttractionCard item={rightCard} />
//             </div>
//           )}

//           {isLastOdd && (
//             <div
//               key={leftCard._key + "-ODD-" + index}
//               className="
//                 absolute left-1/2 -translate-x-1/2 w-[70%]
//                 rounded-2xl bg-white shadow-md overflow-hidden
//                 border border-white/40 animate-card
//               "
//               style={{ "--y": "24px" }}
//             >
//               <AttractionCard item={leftCard} />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ⭐ SAME WAVE & CARD ANIMATIONS */}
//       <style>{`
//         @keyframes liquidWave {
//           0% { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }
//         .animate-liquidWave {
//           animation: liquidWave 12s linear infinite;
//         }

//         @keyframes floatSlow {
//           0% { transform: translateY(0) rotate(0deg); }
//           50% { transform: translateY(-14px) rotate(6deg); }
//           100% { transform: translateY(0) rotate(0deg); }
//         }
//         .animate-floatSlow {
//           animation: floatSlow 7s ease-in-out infinite;
//         }

//         @keyframes floatFast {
//           0% { transform: translateY(0) rotate(0deg); }
//           50% { transform: translateY(16px) rotate(-6deg); }
//           100% { transform: translateY(0) rotate(0deg); }
//         }
//         .animate-floatFast {
//           animation: floatFast 5s ease-in-out infinite;
//         }

//         @keyframes cardIn {
//           0% { opacity: 0; transform: translate(var(--x, 0), var(--y, 12px)) scale(0.98); }
//           100% { opacity: 1; transform: translate(0, 0) scale(1); }
//         }
//         .animate-card {
//           animation: cardIn .55s ease-out both;
//         }
//       `}</style>
//     </section>
//   );
// }
































import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AttractionCard from "../cards/AttractionCard";


export default function AttractionsCarousel({ items = [] }) {
  // Sort items to ensure a consistent experience
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
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
    <section className="relative w-full overflow-hidden pt-12 pb-24 px-6 md:px-8 bg-gradient-to-t from-sky-100 to-white">
      {/* HEADER - Corporate Grade Alignment */}
      <div className="relative z-10 max-w-[1400px] mx-auto text-center mb-12">
        <p className="text-xs font-bold tracking-[0.5em] text-sky-600/70 uppercase mb-4">
          Discover
        </p>
        <h2 className="text-4xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
          Experiences
        </h2>
        <div className="w-20 h-1.5 bg-[#003de6] mx-auto mt-6 mb-8 rounded-full" />
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Discover our amazing collection of thrilling experiences and winter wonders.
        </p>
      </div>

      {/* DESKTOP GRID (4 Columns) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1400px] mx-auto mb-16">
        {sortedItems.slice(0, 4).map((item) => (
          <div key={item?.id}>
            <AttractionCard item={item} />
          </div>
        ))}
      </div>

      {/* MOBILE SLIDER */}
      <div className="md:hidden relative z-10 premium-carousel mb-8">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={1.3}
          centeredSlides={true}
          loop={true}
          loopedSlides={sortedItems.length}
          loopPreventsSliding={false}
          grabCursor={true}
          watchSlidesProgress={true}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="pt-10 pb-10 !overflow-visible"
        >
          {displayItems.map((item, idx) => (
            <SwiperSlide key={`${item?.id ?? idx}-${idx}`} className="h-auto">
              <AttractionCard item={item} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* CUSTOM PAGINATION DOTS - Fixed count per user request */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {sortedItems.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 transition-all duration-300 rounded-full ${realIndex === idx
                ? "w-8 bg-[#003de6]"
                : "w-2 bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>

      {/* VIEW ALL BUTTON */}
      <div className="relative z-10 flex justify-center mt-8">
        <Link
          to="/attractions"
          className="inline-flex items-center gap-3 rounded-xl bg-[#003de6] text-white px-12 py-5 text-lg font-extrabold shadow-2xl hover:bg-[#002db3] hover:scale-105 transition-all duration-300 uppercase tracking-wider"
        >
          View All Experiences
          <span className="text-xl" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ComboCard from "../cards/ComboCard";

export default function CombosCarousel({ items = [] }) {
    // Sort items to ensure a consistent experience
    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const idA = a?.combo_id ?? a?.id ?? 0;
            const idB = b?.combo_id ?? b?.id ?? 0;
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
        <section className="py-24 px-6 md:px-8 bg-[#003de6] overflow-hidden relative">
            <div className="max-w-[1400px] mx-auto relative z-10">
                <div className="text-center mb-16">
                    <p className="text-sm font-bold tracking-[0.4em] text-white/70 uppercase">Exclusive Packs</p>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-4">Combo Deals</h2>
                    <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Save more when you bundle your favorite experiences together</p>
                </div>

                {/* DESKTOP GRID */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {sortedItems.length === 5 ? (
                        <>
                            {/* 2 in first row */}
                            <div className="lg:col-span-3 grid grid-cols-2 gap-8 mb-4 max-w-[1000px] mx-auto w-full">
                                {sortedItems.slice(0, 2).map((item) => (
                                    <div key={item?.id ?? item?.combo_id}>
                                        <ComboCard item={item} />
                                    </div>
                                ))}
                            </div>
                            {/* 3 in second row */}
                            <div className="lg:col-span-3 grid grid-cols-3 gap-8">
                                {sortedItems.slice(2, 5).map((item) => (
                                    <div key={item?.id ?? item?.combo_id}>
                                        <ComboCard item={item} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        sortedItems.map((item) => (
                            <div key={item?.id ?? item?.combo_id}>
                                <ComboCard item={item} />
                            </div>
                        ))
                    )}
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
                                <ComboCard item={item} />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* CUSTOM PAGINATION DOTS - Fixed count per user request */}
                    <div className="flex justify-center items-center gap-2 mt-8">
                        {sortedItems.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 transition-all duration-300 rounded-full ${realIndex === idx
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* VIEW ALL BUTTON */}
                <div className="relative z-10 flex justify-center mt-2">
                    <Link
                        to="/combos"
                        className="inline-flex items-center gap-3 rounded-xl bg-white text-[#1e3a8a] px-10 py-4 text-lg font-bold shadow-xl hover:bg-gray-50 hover:scale-105 transition-all duration-300 border-2 border-[#1e3a8a]/10"
                    >
                        View All Combo Packs
                        <span className="text-xl" aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

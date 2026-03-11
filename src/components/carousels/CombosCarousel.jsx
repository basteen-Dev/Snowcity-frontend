import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ComboCard from "../cards/ComboCard";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export default function CombosCarousel({ items = [] }) {
    // Sort items to ensure a consistent experience
    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const idA = a?.combo_id ?? a?.id ?? 0;
            const idB = b?.combo_id ?? b?.id ?? 0;
            return idA - idB;
        });
    }, [items]);

    const isDesktop = useMediaQuery('(min-width: 768px)');
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
            <div className="w-full relative z-10">
                <div className="text-center mb-16">
                    <p className="text-xs font-bold tracking-[0.4em] text-[#0099ff] uppercase mb-4">Exclusive Packs</p>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">Combo Deals</h2>
                    <div className="w-20 h-1.5 bg-[#0099ff] mx-auto rounded-xl mb-6" />
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">Save more when you bundle your favorite experiences together</p>
                </div>

                {/* CONDITIONAL RENDER FOR DESKTOP OR MOBILE */}
                {isDesktop ? (
                    <div className="mb-16">
                        {(() => {
                            const ultimateOrder = ["Snowcity + Madlabs + Eyelusion", "Snow City + Madlabs + Eyelusion"];
                            const ultimateItem = sortedItems.find(item =>
                                ultimateOrder.some(name => (item?.name || item?.title)?.toLowerCase() === name.toLowerCase())
                            );
                            const otherItems = sortedItems.filter(item => item !== ultimateItem);

                            return (
                                <div className="space-y-12">
                                    {ultimateItem && (
                                        <div className="w-full">
                                            <ComboCard item={ultimateItem} isUltimate={true} />
                                        </div>
                                    )}

                                    {otherItems.length > 0 && (
                                        <div className="grid grid-cols-2 gap-8">
                                            {otherItems.map((item, idx) => (
                                                <div key={`${item?.id ?? item?.combo_id}-desktop-${idx}`}>
                                                    <ComboCard item={item} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="relative z-10 premium-carousel mb-8">
                        {(() => {
                            const ultimateOrder = ["Snowcity + Madlabs + Eyelusion", "Snow City + Madlabs + Eyelusion"];
                            const ultimateItem = sortedItems.find(item =>
                                ultimateOrder.some(name => (item?.name || item?.title)?.toLowerCase() === name.toLowerCase())
                            );
                            const otherItems = sortedItems.filter(item => item !== ultimateItem);
                            const sliderItems = otherItems.length > 0 ? [...otherItems, ...otherItems, ...otherItems] : [];

                            return (
                                <>
                                    {ultimateItem && (
                                        <div className="mb-6 px-4">
                                            <ComboCard item={ultimateItem} isUltimate={true} />
                                        </div>
                                    )}

                                    {otherItems.length > 0 && (
                                        <>
                                            <Swiper
                                                modules={[Autoplay]}
                                                spaceBetween={16}
                                                slidesPerView={1.3}
                                                centeredSlides={true}
                                                loop={true}
                                                loopedSlides={otherItems.length}
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
                                                {sliderItems.map((item, idx) => (
                                                    <SwiperSlide key={`${item?.id ?? idx}-${idx}`} className="h-auto">
                                                        <ComboCard item={item} />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>

                                            {/* CUSTOM PAGINATION DOTS */}
                                            <div className="flex justify-center items-center gap-2 mt-8">
                                                {otherItems.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`h-2 transition-all duration-300 rounded-xl ${realIndex === idx
                                                            ? "w-8 bg-blue-600"
                                                            : "w-2 bg-gray-300"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                <div className="relative z-10 flex justify-center mt-2">
                    <Link
                        to="/combos"
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-600 px-8 py-3 text-sm font-semibold text-sky-600 transition-all duration-300 hover:bg-sky-600 hover:text-white"
                    >
                        View All Combo Packs
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

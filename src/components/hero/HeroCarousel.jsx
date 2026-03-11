import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { imgSrc } from "../../utils/media";

/* ---------------- HELPERS ---------------- */

const getWebImage = (b, fallback) =>
    imgSrc(
        b?.web_image ||
        b?.image_web ||
        b?.webImage ||
        b?.desktop_image ||
        b?.image_url ||
        b?.image ||
        fallback
    );

const getMobileImage = (b, fallback) =>
    imgSrc(
        b?.mobile_image ||
        b?.image_mobile ||
        b?.mobileImage ||
        b?.mobile ||
        b?.image_url_mobile ||
        fallback
    );

function deriveHref(b) {
    const link = b?.link_url || b?.url || b?.href;
    if (link && link !== "#") return link;

    const attSlug = b?.attraction_slug || b?.linked_attraction_slug || b?.attraction?.slug;
    const attId = b?.linked_attraction_id || b?.attraction_id || b?.attraction?.id;
    if (attSlug) return `/${attSlug}`;
    if (attId) return `/attractions/${attId}`;

    const offerSlug = b?.offer_slug || b?.linked_offer_slug;
    const offerId = b?.linked_offer_id || b?.offer_id;
    if (offerSlug) return `/offers/${offerSlug}`;
    if (offerId) return `/offers/${offerId}`;

    const comboSlug = b?.combo_slug || b?.linked_combo_slug || b?.combo?.slug;
    const comboId = b?.combo_id || b?.linked_combo_id || b?.combo?.id;
    if (comboSlug) return `/combo-${comboSlug}`;
    if (comboId) return `/combos/${comboId}`;

    return null;
}

/* ---------------- COMPONENT ---------------- */

export default function HeroCarousel({ banners = [], waveColor = "#0b1a33" }) {
    if (!banners.length) return null;

    // Preload logic for the first banner (LCP optimization)
    React.useEffect(() => {
        if (banners.length > 0) {
            const first = banners[0];
            const desktop = getWebImage(first);
            const mobile = getMobileImage(first);

            const linkD = document.createElement('link');
            linkD.rel = 'preload';
            linkD.as = 'image';
            linkD.href = desktop;
            linkD.media = '(min-width: 768px)';
            document.head.appendChild(linkD);

            const linkM = document.createElement('link');
            linkM.rel = 'preload';
            linkM.as = 'image';
            linkM.href = mobile;
            linkM.media = '(max-width: 767px)';
            document.head.appendChild(linkM);

            return () => {
                try {
                    document.head.removeChild(linkD);
                    document.head.removeChild(linkM);
                } catch (e) { }
            };
        }
    }, [banners]);

    // Sort banners by created_at ascending (first inserted first)
    const sortedBanners = [...banners].sort((a, b) => {
        const aDate = new Date(a.created_at || a.inserted_at || 0);
        const bDate = new Date(b.created_at || b.inserted_at || 0);
        return aDate - bDate;
    });

    return (
        <section id="hero" className="relative w-full overflow-hidden">
            <span id="hero-sentinel" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />

            <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                slidesPerView={1}
                loop
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={1200}
                pagination={{
                    clickable: true
                }}
                className="w-full"
            >
                {sortedBanners.map((b, idx) => {
                    const desktopImg = getWebImage(b, `https://picsum.photos/seed/banner${idx}/1400/700`);
                    const mobileImg = getMobileImage(b, `https://picsum.photos/seed/banner${idx}-m/600/800`);
                    const title = b?.title || b?.name || "";
                    const subtitle = b?.subtitle || b?.description || b?.caption || "";
                    const href = deriveHref(b);
                    const highlight = b?.tagline || b?.label || b?.category || "";
                    const ctaText = b?.cta_text || "Book Your Snow Day";
                    const uniqueKey = b?.banner_id ?? b?.id ?? b?.uuid ?? b?.slug ?? idx;
                    const ticketButton = {
                        label: ctaText,
                        sub: b?.cta_subtitle || "Skip the queue & reserve",
                        href: href || "/tickets-offers",
                        accent: "from-amber-200 via-yellow-300 to-white",
                        textClass: "text-slate-900",
                    };

                    return (
                        <SwiperSlide key={uniqueKey}>
                            <div className="relative w-full">
                                <div className="w-full aspect-[1/1] sm:aspect-[2.5/1] overflow-hidden bg-[#0b1a33]">
                                    <picture>
                                        <source media="(max-width: 767px)" srcSet={mobileImg} />
                                        <img
                                            src={desktopImg}
                                            alt={b?.web_image_alt || title || "Banner"}
                                            className="w-full h-full object-cover block"
                                            loading={idx === 0 ? "eager" : "lazy"}
                                            fetchPriority={idx === 0 ? "high" : "auto"}
                                            decoding={idx === 0 ? "sync" : "async"}
                                        />
                                    </picture>
                                </div>

                                {/* Removed darkening overlays to show original image brightness */}
                                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                <div
                                    className="absolute inset-0 flex flex-col justify-end px-4 md:px-4 z-10 text-left pb-12 sm:pb-16"
                                >
                                    <div className="max-w-4xl space-y-3 sm:space-y-4">
                                        <span className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] uppercase text-sky-400">
                                            {highlight}
                                        </span>
                                        {title ? (
                                            <h2 className="text-white text-3xl sm:text-5xl lg:text-6xl font-black leading-tight drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                                                {title}
                                            </h2>
                                        ) : null}
                                        {subtitle ? (
                                            <p className="text-white/80 text-sm sm:text-base md:text-xl max-w-2xl line-clamp-3 md:line-clamp-none">
                                                {subtitle}
                                            </p>
                                        ) : null}
                                    </div>
                                    {href && (
                                        <div className="flex justify-start">
                                            <a
                                                href={href}
                                                className="group relative inline-flex items-center justify-center rounded-xl px-7 py-3 sm:px-10 sm:py-3.5 text-[10px] sm:text-[12px] font-bold tracking-[0.2em] uppercase text-white bg-transparent border border-white/40 shadow-xl transition-all duration-300 hover:border-white/80 hover:bg-white/5"
                                            >
                                                <span>EXPLORE NOW</span>
                                                <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {href ? (
                                    <a href={href} className="absolute inset-0 z-0" aria-label={title || "Banner"} />
                                ) : null}
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            {/* END OF SWIPER */}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </section>
    );
}

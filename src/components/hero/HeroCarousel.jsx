import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade, Parallax } from "swiper/modules";
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

  // Sort banners by created_at ascending (first inserted first)
  const sortedBanners = [...banners].sort((a, b) => {
    const aDate = new Date(a.created_at || a.inserted_at || 0);
    const bDate = new Date(b.created_at || b.inserted_at || 0);
    return aDate - bDate;
  });

  return (
    <section id="hero" className="relative w-full overflow-hidden h-[80vh] min-h-[600px] pt-14 md:pt-0">
      <span id="hero-sentinel" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />

      <Swiper
        modules={[Autoplay, Pagination, EffectFade, Parallax]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        parallax
        speed={900}
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet !bg-sky-400/70 !opacity-100 !w-2 !h-2 rounded-full",
          bulletActiveClass: "!bg-sky-600 !w-8 transition-all",
        }}
        className="h-full"
      >
        {sortedBanners.map((b, idx) => {
          const desktopImg = getWebImage(b, `https://picsum.photos/seed/banner${idx}/1400/700`);
          const mobileImg = getMobileImage(b, `https://picsum.photos/seed/banner${idx}-m/600/800`);
          const title = b?.title || b?.name || "";
          const subtitle = b?.subtitle || b?.description || b?.caption || "";
          const href = deriveHref(b);
          const highlight = b?.tagline || b?.label || b?.category || "Everlasting Winter";
          const ctaText = b?.cta_text || "Book Your Snow Day";
          const uniqueKey = b?.banner_id ?? b?.id ?? b?.uuid ?? b?.slug ?? idx;
          const ticketButton = {
            label: ctaText,
            sub: b?.cta_subtitle || "Skip the queue & reserve",
            href: href || "/booking",
            accent: "from-amber-200 via-yellow-300 to-white",
            textClass: "text-slate-900",
          };

          return (
            <SwiperSlide key={uniqueKey}>
              <div className="relative w-full h-full">
                <div className="absolute inset-0" data-swiper-parallax="-20%">
                  <picture>
                    <source media="(max-width: 767px)" srcSet={mobileImg} />
                    <img
                      src={desktopImg}
                      alt={title || "Banner"}
                      className="w-full h-full object-cover object-[center_35%] md:object-center will-change-transform animate-kenburns brightness-[1.12] contrast-[1.18] saturate-125"
                      style={{
                        objectPosition: 'center',
                        objectFit: 'cover'
                      }}
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      sizes="(max-width: 767px) 100vw, 100vw"
                    />
                  </picture>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/85 via-[#0f172a]/45 to-transparent mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />

                <div
                  className="absolute inset-0 flex flex-col justify-between px-4 sm:px-10 z-10 text-left pb-8"
                  data-swiper-parallax="-200"
                >
                  <div className="max-w-4xl space-y-4 pt-14 md:pt-0">
                    <span className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-white/75">
                      {highlight}
                    </span>
                    {title ? (
                      <h2 className="text-white text-3xl sm:text-5xl font-black leading-tight drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? (
                      <p className="text-white/80 text-base md:text-xl max-w-2xl">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                  {href && (
                    <div className="flex justify-center">
                      <a
                        href={href}
                        className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 sm:px-10 sm:py-3.5 text-[12px] sm:text-sm font-semibold tracking-[0.28em] uppercase text-white bg-transparent border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_0_1px_rgba(255,255,255,0.10),0_0_26px_rgba(255,255,255,0.14),0_18px_55px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_0_1px_rgba(255,255,255,0.16),0_0_40px_rgba(255,255,255,0.20),0_26px_70px_rgba(0,0,0,0.55)] hover:-translate-y-[1px] active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                      >
                        <span className="relative">
                          EXPLORE NOW
                        </span>
                        <svg className="ml-2 w-4 h-4 opacity-90 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        .animate-kenburns {
          animation: kenburns 18s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

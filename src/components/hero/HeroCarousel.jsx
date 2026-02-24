import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { imgSrc } from "../../utils/media";

/* Helpers */

const getWebImage = (b, fallback) =>
  imgSrc(b?.web_image || b?.desktop_image || b?.image_url, fallback);

const getMobileImage = (b, fallback) =>
  imgSrc(b?.mobile_image || b?.image_url_mobile, fallback);

function deriveHref(b) {
  const link = b?.link_url || b?.url || b?.href;
  if (link) return link;

  const attSlug = b?.attraction_slug || b?.linked_attraction_slug || b?.attraction?.slug;
  if (attSlug) return `/${attSlug}`;

  const offerSlug = b?.offer_slug || b?.linked_offer_slug;
  if (offerSlug) return `/offers/${offerSlug}`;

  const comboSlug = b?.combo_slug || b?.linked_combo_slug || b?.combo?.slug;
  if (comboSlug) return `/combo-${comboSlug}`;

  return null;
}

/* Component */

export default function HeroCarousel({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden h-[85vh] min-h-[600px] md:h-[80vh]"
    >
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        slidesPerView={1}
        loop
        speed={700} // smooth slide
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        preloadImages={false}
        watchSlidesProgress
        className="h-full"
      >
        {banners.map((b, idx) => {
          const desktopImg = getWebImage(
            b,
            "https://your-bucket.s3.ap-south-1.amazonaws.com/fallback-desktop.webp"
          );

          const mobileImg = getMobileImage(
            b,
            "https://your-bucket.s3.ap-south-1.amazonaws.com/fallback-mobile.webp"
          );

          const href = deriveHref(b);

          return (
            <SwiperSlide key={b.id || idx}>
              <div className="relative w-full h-full">

                {/* Image */}
                <picture>
                  <source
                    media="(max-width: 767px)"
                    srcSet={mobileImg}
                  />

                  <img
                    src={desktopImg}
                    alt={b?.title || "Banner"}
                    width="1600"
                    height="800"
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                </picture>

                {/* Single lightweight overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />

                {/* CTA */}
                {href && (
                  <div className="absolute inset-0 flex items-end justify-center pb-10 z-10">
                    <a
                      href={href}
                      className="rounded-full border border-white/70 px-8 py-3 text-sm tracking-widest text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                    >
                      EXPLORE NOW
                    </a>
                  </div>
                )}

                {/* Clickable slide */}
                {href && (
                  <a
                    href={href}
                    className="absolute inset-0 z-10"
                    aria-label="Banner link"
                  />
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* CLS Fix */}
      <style>{`
        #hero img {
          aspect-ratio: 2 / 1;
        }
        @media (max-width: 768px) {
          #hero img {
            aspect-ratio: 3 / 4;
          }
        }
      `}</style>
    </section>
  );
}
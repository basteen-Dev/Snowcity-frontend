import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';
import { getPrice, getBasePrice } from '../../utils/pricing';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
// Video loaded dynamically below — not statically imported (saves ~1.79 MB from initial bundle)

const AttractionCardInner = function AttractionCard({ item, featured = false }) {
  const navigate = useNavigate();
  const title = item?.name || item?.title || 'Attraction';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/attr/800/600');
  const attrId = getAttrId(item);
  const detailHref = item?.slug ? `/${item.slug}` : (attrId ? `/attractions/${attrId}` : '/attractions');

  const finalPrice = getPrice(item, { includeOffers: false });
  const basePrice = getBasePrice(item);
  const displayPrice = finalPrice || basePrice || 699;

  const [gallery, setGallery] = React.useState([]);
  const [videoSrc, setVideoSrc] = React.useState(null);

  React.useEffect(() => {
    if (featured && attrId) {
      (async () => {
        try {
          const res = await api.get(endpoints.gallery.list(), {
            params: {
              active: true,
              target_type: 'attraction',
              target_ref_id: attrId,
              limit: 4,
            },
          });
          const items = res?.data?.data || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
          setGallery(items.slice(0, 4));
        } catch (err) {
          console.error('Failed to load gallery for featured card:', err);
        }
      })();
    }
  }, [featured, attrId]);

  // Dynamically load video only for Snow Park featured card
  React.useEffect(() => {
    if (featured && title.toLowerCase().includes('snow park')) {
      import('../../assets/images/Web gif_GStory_1772876679.mp4').then(mod => setVideoSrc(mod.default));
    }
  }, [featured, title]);

  const stop = (e) => e.stopPropagation();

  const goDetail = (e) => {
    if (e) stop(e);
    navigate(detailHref);
  };

  const onBook = (e) => {
    stop(e);
    e.preventDefault();
    sessionStorage.removeItem('snowcity_booking_state');
    navigate(attrId ? `/tickets-offers?attraction_id=${attrId}&type=attraction&openDrawer=true` : '/tickets-offers');
  };

  const isSnowPark = title.toLowerCase().includes('snow park');
  const isEyelusion = title.toLowerCase().includes('eyelusion');
  const isMadLab = title.toLowerCase().includes('mad lab') || title.toLowerCase().includes('madlab');
  const isDarkHouse = title.toLowerCase().includes('dark house') || title.toLowerCase().includes('devil');

  const renderHighlights = (isFeaturedCard) => {
    const chipClass = isFeaturedCard ? "feat-chip" : "feat-chip-dark";
    const containerClass = isFeaturedCard ? "exp-feat-highlights" : "flex flex-wrap gap-2 mt-4 mb-2";

    return (
      <div className={containerClass}>
        {(isSnowPark) && (
          <>
            <span className={chipClass}>❄️ Real Snow Fall</span>
            <span className={chipClass}>🌡️ -7°C Temperature</span>
          </>
        )}

        {isSnowPark && (
          <>
            <span className={chipClass}>🛝 Snow Slides</span>
            <span className={chipClass}>🧗 Ice Wall Climb</span>
            <span className={chipClass}>🪩 Snow Disco</span>
            <span className={chipClass}>🧤 Gear Provided</span>
            <span className={chipClass}>👶 Toddler Friendly</span>
          </>
        )}

        {isMadLab && (
          <>
            <span className={chipClass}>⏱ Duration: 60–90 min</span>
            <span className={chipClass}>👥 Best For Families</span>
          </>
        )}

        {isEyelusion && (
          <>
            <span className={chipClass}>⏱ Duration: 45–75 min</span>
            <span className={chipClass}>📱 Bring Your Phone</span>
          </>
        )}

        {/* Default Fallback for other attractions */}
        {!isSnowPark && !isMadLab && !isEyelusion && (
            <>
     
              <span className={chipClass}>👨‍👩‍👧‍👦 Kids Favour</span>
              <span className={chipClass}>👨‍👩‍👧‍👦 Family Friendly</span>
            </>
          )}
      </div>
    );
  };

  if (featured) {
    return (
      <div className="exp-featured rounded-xl group cursor-pointer" onClick={goDetail}>
        <div className="exp-feat-left">
          <div className="exp-feat-tag">
            <span role="img" aria-label="star">⭐</span> Most Popular Experience
          </div>

          <div>
            <h2 className="exp-feat-title">{title}</h2>
            <p className="exp-feat-desc">{desc}</p>
            {renderHighlights(true)}
          </div>

          <div className="exp-feat-footer">
            <div>
              <p className="text-[10px] text-white/80 uppercase font-bold tracking-wider mb-1">FROM / PER PERSON</p>
              <div className="flex items-center gap-2">
                <div className="exp-feat-price">
                  ₹{Math.round(displayPrice)}
                </div>
                {Math.round(basePrice) > Math.round(displayPrice) && (
                  <span className="text-sm text-white/60 line-through decoration-white/40">
                    ₹{Math.round(basePrice)}
                  </span>
                )}
              </div>
            </div>
            <button
              className={`btn-book-new px-10 py-5 text-lg ${title.toLowerCase().includes('snow park') ? '!bg-white !text-[#0099ff]' : ''}`}
              onClick={onBook}
            >
              Book Now <span>→</span>
            </button>
          </div>
        </div>

        <div className="exp-feat-right">
          <div className="feat-visual-grid">
            {(title.toLowerCase().includes('snow park') ? [0, 1, 2] : [0, 1, 2, 3]).map((idx) => {
              // For Snow Park: 
              // 0 -> Main Image (top left)
              // 1 -> Video (full right column)
              // 2 -> Gallery Image (bottom left)

              const isSnowPark = title.toLowerCase().includes('snow park');

              if (isSnowPark && idx === 1) {
                return (
                  <div key="video-cell" className="feat-vg-cell">
                    {videoSrc ? (
                    <video
                      src={videoSrc}
                      poster={img}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="none"
                      className="w-full h-full object-cover"
                    />
                    ) : (
                      <img src={img} alt="Snow Park" className="w-full h-full object-cover" />
                    )}
                  </div>
                );
              }

              // Mapping for Snow Park to get correct images
              // idx 0 -> img (main)
              // idx 2 -> gallery[0] (or 1)
              let displayImg;
              if (isSnowPark) {
                if (idx === 0) displayImg = img;
                else {
                  // idx 2
                  const gImg = gallery[0] ? imgSrc(gallery[0].url || gallery[0].image_url) : null;
                  displayImg = gImg || `https://picsum.photos/seed/snow${idx}/400/300`;
                }
              } else {
                const galleryImg = gallery[idx] ? imgSrc(gallery[idx].url || gallery[idx].image_url) : null;
                displayImg = galleryImg || (idx === 0 ? img : `https://picsum.photos/seed/snow${idx}/400/300`);
              }

              return (
                <div key={idx} className="feat-vg-cell">
                  <img
                    src={displayImg}
                    alt={`${title} view ${idx + 1}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                  />
                </div>
              );
            })}
          </div>

          <div className="feat-temp-badge">
            <div className="feat-temp-num">-7°C</div>
            <div className="feat-temp-label">FREEZING ZONE</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exp-card-new rounded-xl group cursor-pointer" onClick={goDetail}>
      <div className="exp-card-visual relative">
          {isMadLab && (
            <>
              {/* Top Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1 z-10 border border-white/20">
                🔥 Fan Favourite
              </div>
              
              {/* Bottom Glassmorphism Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-10">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  🔬 Science
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  ✨ Interactive
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  👨‍👩‍👧‍👦 All Ages
                </span>
              </div>
            </>
          )}

          {isEyelusion && (
            <>
              {/* Top Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1 z-10 border border-white/20">
                📸 Instagram Worthy
              </div>
              
              {/* Bottom Glassmorphism Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-10">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  ✨ Illusion
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  🤳 Photo Ops
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border border-white/30 shadow-sm">
                  🖼️ 24 Setups
                </span>
              </div>
            </>
          )}

          {isDarkHouse && (
            <>
              {/* Top Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-green-700 to-green-900 border border-green-500/30 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1 z-10">
                👻 Thrill Seekers
              </div>
              
              {/* Bottom Glassmorphism Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-10">
                <span className="bg-black/40 backdrop-blur-md text-red-200 border-red-500/30 text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border shadow-sm">
                  🩸 Horror
                </span>
                <span className="bg-black/40 backdrop-blur-md text-gray-200 border-gray-500/30 text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-md border shadow-sm">
                  🏚️ Immersive
                </span>
                <span className="bg-red-900/40 backdrop-blur-md text-white text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md border border-red-500/50 shadow-sm">
                  🔞 5+ Years
                </span>
              </div>
            </>
          )}
          <img
            src={img}
            alt={item?.image_alt || title}
            width={640}
            height={400}
            loading={featured ? "eager" : "lazy"}
            fetchPriority={featured ? "high" : "auto"}
            className="w-full h-full object-cover"
          />
      </div>

      <div className="exp-card-body">
        <h3 className="exp-card-title">{title}</h3>
        <p className="exp-card-desc line-clamp-2">{desc}</p>
        {renderHighlights(false)}

        <div className="exp-card-footer mt-auto">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-1">FROM / PER PERSON</p>
            <div className="flex items-center gap-2">
              <div className="price-val-new">
                ₹{Math.round(displayPrice)}
              </div>
              {Math.round(basePrice) > Math.round(displayPrice) && (
                <span className="text-xs text-gray-400 line-through decoration-gray-300">
                  ₹{Math.round(basePrice)}
                </span>
              )}
            </div>
          </div>
          <button
            className={`btn-book-new ${title.toLowerCase().includes('snow park') ? '!bg-white !text-[#0099ff]' : ''}`}
            onClick={onBook}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AttractionCardInner);

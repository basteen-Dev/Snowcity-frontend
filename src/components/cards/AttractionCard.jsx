import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';
import { getPrice, getBasePrice } from '../../utils/pricing';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import snowParkVideo from '../../assets/images/Web gif_GStory_1772876679.mp4';

export default function AttractionCard({ item, featured = false }) {
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

  const renderHighlights = (isFeaturedCard) => {
    const chipClass = isFeaturedCard ? "feat-chip" : "feat-chip-dark";
    const containerClass = isFeaturedCard ? "exp-feat-highlights" : "flex flex-wrap gap-2 mt-4 mb-2";
    
    const isSnowPark = title.toLowerCase().includes('snow park');
    const isMadLab = title.toLowerCase().includes('mad lab') || title.toLowerCase().includes('madlab');
    const isEyelusion = title.toLowerCase().includes('eyelusion');

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
              <div className="exp-feat-price">
                ₹{Math.round(displayPrice)}
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
                    <video
                      src={snowParkVideo}
                      poster={img}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="none"
                      className="w-full h-full object-cover"
                    />
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
      <div className="exp-card-visual">
        <img
          src={img}
          alt={item?.image_alt || title}
          loading={featured ? "eager" : "lazy"}
          fetchPriority={featured ? "high" : "auto"}
        />
      </div>

      <div className="exp-card-body">
        <h3 className="exp-card-title">{title}</h3>
        <p className="exp-card-desc line-clamp-2">{desc}</p>
        {renderHighlights(false)}

        <div className="exp-card-footer mt-auto">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-1">FROM / PER PERSON</p>
            <div className="price-val-new">
              ₹{Math.round(displayPrice)}
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

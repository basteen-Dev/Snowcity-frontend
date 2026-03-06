import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';
import { getPrice, getBasePrice } from '../../utils/pricing';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

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

            <div className="exp-feat-highlights">
              <span className="feat-chip">❄️ Real Snow Fall</span>
              <span className="feat-chip">🌡️ -5°C Temperature</span>
              <span className="feat-chip">👨‍👩‍👧‍👦 Family Friendly</span>
            </div>
          </div>

          <div className="exp-feat-footer">
            <div className="exp-feat-price">
              <sub>From / Per Person</sub> ₹{Math.round(displayPrice)}
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
            {[0, 1, 2, 3].map((idx) => {
              const galleryImg = gallery[idx] ? imgSrc(gallery[idx].url || gallery[idx].image_url) : null;
              const displayImg = galleryImg || (idx === 0 ? img : `https://picsum.photos/seed/snow${idx}/400/300`);
              return (
                <div key={idx} className="feat-vg-cell">
                  <img src={displayImg} alt={`${title} view ${idx + 1}`} loading="lazy" />
                </div>
              );
            })}
          </div>

          <div className="feat-temp-badge">
            <div className="feat-temp-num">-5°C</div>
            <div className="feat-temp-label">FREEZING ZONE</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exp-card-new rounded-xl group cursor-pointer" onClick={goDetail}>
      <div className="exp-card-visual">
        <img src={img} alt={item?.image_alt || title} loading="lazy" />
      </div>

      <div className="exp-card-body">
        <h3 className="exp-card-title">{title}</h3>
        <p className="exp-card-desc line-clamp-3">{desc}</p>

        <div className="exp-card-footer">
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

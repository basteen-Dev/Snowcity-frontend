// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { getAttrId } from '../../utils/ids';
// import { imgSrc } from '../../utils/media';
// import { getPrice, getBasePrice, getDiscountPercent } from '../../utils/pricing';

// export default function AttractionCard({ item }) {
//   const title = item?.name || item?.title || 'Attraction';
//   const desc = item?.short_description || item?.subtitle || '';
//   const img = imgSrc(item, 'https://picsum.photos/seed/attr/640/400');
//   const attrId = getAttrId(item);
//   const detailHref = attrId ? `/attractions/${attrId}` : '/attractions';
//   const finalPrice = getPrice(item, { includeOffers: false });
//   const basePrice = getBasePrice(item);
//   const displayPrice = finalPrice || basePrice;
//   const hasDiscount = basePrice > 0 && finalPrice > 0 && finalPrice < basePrice;
//   const discountPercent = hasDiscount ? Math.round(getDiscountPercent(item)) : 0;

//   const navigate = useNavigate();
//   const stop = (e) => e.stopPropagation();

//   const goDetail = React.useCallback(() => {
//     if (detailHref) navigate(detailHref);
//   }, [detailHref, navigate]);

//   return (
//     <div
//       role="button"
//       tabIndex={0}
//       onClick={goDetail}
//       onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault();
//           goDetail();
//         }
//       }}
//       className="group relative flex flex-col rounded-2xl bg-white/95 text-slate-900 shadow-[0_18px_45px_rgba(14,165,233,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(14,165,233,0.18)] focus:outline-none"
//     >
//       <div className="relative overflow-hidden rounded-2xl rounded-b-none">
//         <img
//           src={img}
//           alt="snowcity"
//           className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
//           loading="lazy"
//           decoding="async"
//         />
//         {displayPrice > 0 ? (
//           <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-sky-600/90 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
//             ₹{Math.round(displayPrice)}
//             <span className="text-white/70 hidden sm:inline">/ person</span>
//             {hasDiscount ? (
//               <span className="text-[11px] font-semibold text-sky-200">-{discountPercent}%</span>
//             ) : null}
//           </div>
//         ) : null}
//         <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
//       </div>

//       <div className="flex flex-col gap-1 sm:gap-1 px-2 sm:px-1 pt-2 sm:pt-1 pb-3 sm:pb-1">
//         <div className="flex items-start justify-between gap-4">
//           <div>

//             <h3 className="mt-1 text-xl font-semibold text-slate-900 line-clamp-2">{title}</h3>
//           </div>
//           <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
//             Indoor Snow
//           </span>
//         </div>

//         {desc ? <p className="text-sm text-slate-500 line-clamp-3">{desc}</p> : null}

//         {displayPrice > 0 ? (
//           <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-0.5 sm:pt-2">
//             <span className="text-2xl font-semibold text-slate-900">₹{Math.round(displayPrice)}</span>
//             {hasDiscount ? (
//               <>
//                 <span className="text-sm line-through text-slate-400">₹{Math.round(basePrice)}</span>
//                 <span className="rounded-full border border-emerald-200/70 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50">
//                   Save {discountPercent}%
//                 </span>
//               </>
//             ) : (
//               <span className="text-sm text-slate-500">per person</span>
//             )}
//           </div>
//         ) : null}

//         <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2.5 sm:pt-4 border-t border-slate-100">
//           <Link
//             to={attrId ? `/booking?attraction_id=${attrId}&openDrawer=true` : '/booking'}
//             onClick={stop}
//             className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-600 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-sky-900/15 hover:bg-sky-700 transition-all duration-200"
//           >
//             🎟 Book Now
//           </Link>
//           {attrId ? (
//             <Link
//               to={detailHref}
//               onClick={stop}
//               className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-900"
//             >
//               Quick View
//               <span aria-hidden="true">→</span>
//             </Link>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// }
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';
import { getPrice, getBasePrice, getDiscountPercent } from '../../utils/pricing';

const StyledWrapper = styled.div`
  height: 100%;

  .card {
    width: 100%;
    height: 100%;
    border-radius: 1rem;
    background-color: #fff;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 35px -5px rgba(0, 0, 0, 0.15), 0 12px 15px -5px rgba(0, 0, 0, 0.08);
  }

  .card a {
    text-decoration: none;
  }

  .content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .image-box {
    position: relative;
    width: 100%;
    height: 180px;
    background-color: #f3f4f6;
    overflow: hidden;
  }

  .image-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .card:hover .image-box img {
    transform: scale(1.1);
  }

  .title {
    color: #111827;
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s;
  }
  
  .title:hover {
    color: #003de6;
  }

  .desc {
    color: #6B7280;
    font-size: 0.875rem;
    line-height: 1.5rem;
    margin-bottom: 1.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
    margin-top: auto;
  }

  .price-info {
    display: flex;
    flex-direction: column;
  }

  .price-cap {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    font-weight: 600;
  }

  .price-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: #111827;
  }

  .action {
    display: inline-flex;
    color: #ffffff;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    align-items: center;
    gap: 0.5rem;
    background-color: #003de6;
    padding: 0.6rem 1rem;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  .action span {
    transition: transform 0.3s ease;
  }

  .action:hover {
    background-color: #002db3;
    transform: scale(1.05);
  }

  .action:hover span {
    transform: translateX(4px);
  }

  .featured-tag {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #f59e0b;
    color: white;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 5px 12px;
    border-radius: 999px;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }
`;

export default function AttractionCard({ item, featured = false }) {
  const title = item?.name || item?.title || 'Attraction';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/attr/640/400');
  const attrId = getAttrId(item);
  const detailHref = item?.slug ? `/${item.slug}` : (attrId ? `/attractions/${attrId}` : '/attractions');

  const finalPrice = getPrice(item, { includeOffers: false });
  const basePrice = getBasePrice(item);
  const displayPrice = finalPrice || basePrice;

  const navigate = useNavigate();
  const stop = (e) => e.stopPropagation();

  const goDetail = React.useCallback((e) => {
    if (e) stop(e);
    navigate(detailHref);
  }, [detailHref, navigate]);

  return (
    <StyledWrapper>
      <div
        onClick={(e) => goDetail(e)}
        className="card block no-underline cursor-pointer"
        role="button"
        tabIndex={0}
      >
        <div className="image-box">
          {img && (
            <img
              src={img}
              alt={item?.image_alt || title}
              loading="lazy"
              decoding="async"
            />
          )}
          {featured && <div className="featured-tag">Most Popular</div>}
        </div>

        <div className="content">
          <div className="title">
            {title}
          </div>

          <p className="desc">{desc}</p>

          <div className="action-row">
            <div className="price-info">
              <span className="price-cap">From</span>
              <span className="price-val">₹{Math.round(displayPrice || 699)}</span>
            </div>

            <div
              onClick={(e) => {
                stop(e);
                e.preventDefault();
                sessionStorage.removeItem('snowcity_booking_state');
                navigate(attrId ? `/booking?attraction_id=${attrId}&type=attraction&openDrawer=true` : '/booking');
              }}
              className="action"
            >
              Book Now
              <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

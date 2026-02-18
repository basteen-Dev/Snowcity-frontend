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
import { getAttrId } from '../../utils/ids';
import { imgSrc } from '../../utils/media';
import { getPrice, getBasePrice, getDiscountPercent } from '../../utils/pricing';

export default function AttractionCard({ item, featured = false }) {
  const title = item?.name || item?.title || 'Attraction';
  const desc = item?.short_description || item?.subtitle || '';
  const img = imgSrc(item, 'https://picsum.photos/seed/attr/640/400');
  const attrId = getAttrId(item);
  // Prefer slug-based friendly URLs when available (e.g. /snow-park)
  const detailHref = item?.slug ? `/${item.slug}` : (attrId ? `/attractions/${attrId}` : '/attractions');

  const finalPrice = getPrice(item, { includeOffers: false });
  const basePrice = getBasePrice(item);
  const displayPrice = finalPrice || basePrice;
  const hasDiscount =
    basePrice > 0 && finalPrice > 0 && finalPrice < basePrice;
  const discountPercent = hasDiscount
    ? Math.round(getDiscountPercent(item))
    : 0;

  const navigate = useNavigate();
  const stop = (e) => e.stopPropagation();

  const goDetail = React.useCallback(() => {
    navigate(detailHref);
  }, [detailHref, navigate]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goDetail();
        }
      }}
      className={`exp-card ${featured ? 'featured' : ''}`}
    >
      <div className="exp-card-img">
        {img && (
          <img
            src={img}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        {featured && <div className="featured-tag">Most Populer</div>}
        
      </div>
      <div className="exp-card-body">
        <div className="exp-type">Attraction</div>
        <div className="exp-name">{title}</div>
        <div className="exp-desc">{desc}</div>
        <div className="exp-footer">
          <div>
            <div className="exp-price-label">Per Person</div>
            <div className="exp-price">₹{Math.round(displayPrice || 699)} <span>onwards</span></div>
          </div>
          <Link
            to={
              attrId
                ? `/booking?attraction_id=${attrId}&openDrawer=true`
                : '/booking'
            }
            onClick={stop}
            className="btn-book-exp"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

import{A as g,R as h,j as o,L as b,B as m}from"./index-CmreT6x1.js";import{g as u}from"./ids-YExsbyMi.js";import{i as w}from"./media-DcknJ8BL.js";import{g as v,a as j}from"./pricing-Df4qX4St.js";const k=m.div`
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
`;function A({item:e,featured:l=!1}){const s=(e==null?void 0:e.name)||(e==null?void 0:e.title)||"Attraction",d=(e==null?void 0:e.short_description)||(e==null?void 0:e.subtitle)||"",n=w(e,"https://picsum.photos/seed/attr/640/400"),a=u(e),t=e!=null&&e.slug?`/${e.slug}`:a?`/attractions/${a}`:"/attractions",p=v(e,{includeOffers:!1}),f=j(e),x=p||f,i=g(),c=r=>r.stopPropagation();return h.useCallback(r=>{r&&c(r),i(t)},[t,i]),o.jsx(k,{children:o.jsxs(b,{to:t,className:"card block no-underline",children:[o.jsxs("div",{className:"image-box",children:[n&&o.jsx("img",{src:n,alt:s,loading:"lazy",decoding:"async"}),l&&o.jsx("div",{className:"featured-tag",children:"Most Popular"})]}),o.jsxs("div",{className:"content",children:[o.jsx("div",{className:"title",children:s}),o.jsx("p",{className:"desc",children:d}),o.jsxs("div",{className:"action-row",children:[o.jsxs("div",{className:"price-info",children:[o.jsx("span",{className:"price-cap",children:"From"}),o.jsxs("span",{className:"price-val",children:["₹",Math.round(x||699)]})]}),o.jsxs("div",{onClick:r=>{c(r),i(a?`/booking?attraction_id=${a}&openDrawer=true`:"/booking")},className:"action",children:["Book Now",o.jsx("span",{"aria-hidden":"true",children:"→"})]})]})]})]})})}export{A};

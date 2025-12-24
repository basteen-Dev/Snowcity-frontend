import{j as t,L as h}from"./index-LUC8W6HM.js";import{f as b}from"./formatters-CmiLqhJj.js";import{g,a as j,b as v,e as w}from"./pricing-CIeFTiJd.js";import{i as N}from"./media-Cid05Mxy.js";function _({item:s}){var i;const o=(s==null?void 0:s.name)||(s==null?void 0:s.title)||"Offer",e=(s==null?void 0:s.short_description)||(s==null?void 0:s.subtitle)||"",x=N(s,"https://picsum.photos/seed/offer/640/400"),n=g(s),a=j(s),l=a>0&&n>0&&n<a,r=l?Math.round(v(s)||(a-n)/a*100):0,f=w(s),c=(s==null?void 0:s.attraction_id)||((i=s==null?void 0:s.attraction)==null?void 0:i.id)||null,d=c?`/booking?attraction_id=${c}`:null,p=u=>u.stopPropagation();return t.jsxs("div",{className:`
        group relative h-[420px] w-full overflow-hidden rounded-2xl
        bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        transition-all duration-300 hover:-translate-y-1
      `,children:[t.jsx("img",{src:x,alt:o,className:`
          absolute inset-0 h-full w-full object-cover
          transition-transform duration-700 group-hover:scale-110
        `,loading:"lazy",decoding:"async"}),t.jsx("span",{className:`
          absolute top-4 left-4 z-10 rounded-full bg-white/85 px-4 py-1
          text-xs font-semibold text-slate-900 backdrop-blur
        `,children:"Offer"}),n>0?t.jsxs("div",{className:"absolute top-4 right-4 z-10 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-semibold text-white",children:[b(n),l?t.jsxs("span",{className:"ml-1 text-sky-200",children:["-",r,"%"]}):null]}):null,t.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"}),t.jsxs("div",{className:"absolute bottom-0 z-10 w-full px-5 pb-5 text-white",children:[t.jsx("h3",{className:"text-xl font-semibold leading-tight line-clamp-2",children:o}),e?t.jsx("p",{className:"mt-1 text-sm text-white/80 line-clamp-2",children:e}):null,n>0?t.jsx("div",{className:"mt-2 text-xs text-white/70",children:l?t.jsxs("span",{className:"font-semibold text-emerald-200",children:["Save ",r,"%"]}):t.jsx("span",{children:f})}):null,t.jsx("div",{className:"mt-4 flex items-center justify-center",children:t.jsx(h,{to:d||"/offers",onClick:p,className:`
              rounded-full bg-sky-400 px-8 py-2.5
              text-sm font-bold text-slate-900
              shadow-lg transition-all
              hover:bg-sky-300
            `,children:d?"Book Now":"View Offers"})})]})]})}export{_ as O};

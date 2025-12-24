import{B as f,R as b,j as s,L as k}from"./index-LUC8W6HM.js";import{g as v}from"./ids-YExsbyMi.js";import{i as j}from"./media-Cid05Mxy.js";import{g as y,a as w,b as N}from"./pricing-CIeFTiJd.js";function A({item:t}){const l=(t==null?void 0:t.name)||(t==null?void 0:t.title)||"Attraction",r=(t==null?void 0:t.short_description)||(t==null?void 0:t.subtitle)||"",x=j(t,"https://picsum.photos/seed/attr/640/400"),a=v(t),c=t!=null&&t.slug?`/${t.slug}`:a?`/attractions/${a}`:"/attractions",o=y(t,{includeOffers:!1}),e=w(t),i=o||e,d=e>0&&o>0&&o<e,g=d?Math.round(N(t)):0,u=f(),h=n=>n.stopPropagation(),p=b.useCallback(()=>{u(c)},[c,u]);return s.jsxs("div",{role:"button",tabIndex:0,onClick:p,onKeyDown:n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),p())},className:`
        group relative h-[420px] w-full overflow-hidden rounded-2xl
        bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        transition-all duration-300 hover:-translate-y-1
        focus:outline-none
      `,children:[s.jsx("img",{src:x,alt:l,className:`
          absolute inset-0 h-full w-full object-cover
          transition-transform duration-700 group-hover:scale-110
        `,loading:"lazy",decoding:"async"}),i>0&&s.jsxs("div",{className:"absolute top-4 right-4 z-10 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-semibold text-white",children:["₹",Math.round(i),d&&s.jsxs("span",{className:"ml-1 text-sky-200",children:["-",g,"%"]})]}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"}),s.jsxs("div",{className:"absolute bottom-0 z-10 w-full px-5 pb-5 text-white",children:[s.jsx("h3",{className:"text-xl font-semibold leading-tight line-clamp-2",children:l}),r&&s.jsx("p",{className:"mt-1 text-sm text-white/80 line-clamp-2",children:r}),s.jsx("div",{className:"mt-4 flex items-center justify-center",children:s.jsx(k,{to:a?`/booking?attraction_id=${a}&openDrawer=true`:"/booking",onClick:h,className:`
              rounded-full bg-sky-400 px-8 py-2.5
              text-sm font-bold text-slate-900
              shadow-lg transition-all
              hover:bg-sky-300
            `,children:"Book Now"})})]})]})}export{A};

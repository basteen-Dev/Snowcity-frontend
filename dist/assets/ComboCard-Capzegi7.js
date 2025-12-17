import{j as a,L as _}from"./index-CNdOvwUA.js";import{f as y}from"./formatters-CmiLqhJj.js";import{g as k}from"./pricing-CIeFTiJd.js";import{i as j}from"./media-Ct2xuz47.js";const m=(e="combo")=>`https://picsum.photos/seed/${e}/640/400`,A=(e,s="combo")=>j(typeof e=="string"&&e?e:m(s)),N=e=>!e&&e!==0?"":j(e,"")||"",C=e=>{if(!e)return"";const s=[e.hero_image,e.banner_image,e.image_web,e.image_mobile,e.image_url,e.cover_image,e.poster_image,e.thumbnail,e.banner_media_id,e.image_media_id,e.cover_media_id,Array.isArray(e.media)?e.media[0]:null,Array.isArray(e.gallery)?e.gallery[0]:null,e.image];for(const n of s){const l=N(n);if(l)return l}return""},I=(e,s=[])=>{var i,r,o,p,x,f,d,u;const n=[],l=new Set,t=h=>{const g=N(h);g&&!l.has(g)&&(l.add(g),n.push(g))};return e&&([(i=e.attraction_1)==null?void 0:i.image_url,e.attraction_1_image,(r=e.attraction_1)==null?void 0:r.cover_image,(o=e.attraction_2)==null?void 0:o.image_url,e.attraction_2_image,(p=e.attraction_2)==null?void 0:p.cover_image,(f=(x=e.attraction_1)==null?void 0:x.media)==null?void 0:f[0],(u=(d=e.attraction_2)==null?void 0:d.media)==null?void 0:u[0]].forEach(t),Array.isArray(e.media)&&e.media.forEach(t),Array.isArray(e.gallery)&&e.gallery.forEach(t)),s.forEach(t),n.slice(0,2)},v=(e,s="Attraction",n="combo-attraction")=>{if(!e||typeof e!="object")return{title:s,image_url:m(n),slug:null,price:0,href:null};const l=e.title||e.name||s,t=e.slug||e.id||e.attraction_id||null,i=Number(e.base_price||e.price||e.amount||0),r=A(e.image_url||e.cover_image||e.image,n);return{title:l,image_url:r,slug:t,price:i,href:t?`/attractions/${t}`:null}},c=e=>{const s=Number(e);return Number.isFinite(s)?s:0},E=e=>{if(!e||typeof e!="object")return 0;const s=c(e.total_price);if(s>0)return s;if(Array.isArray(e.attractions)&&e.attractions.length){const t=e.attractions.reduce((i,r)=>i+c((r==null?void 0:r.price)??(r==null?void 0:r.base_price)??(r==null?void 0:r.amount)),0);if(t>0)return t}if(Array.isArray(e.combo_attractions)&&e.combo_attractions.length){const t=e.combo_attractions.reduce((i,r)=>i+c((r==null?void 0:r.attraction_price)??(r==null?void 0:r.price)),0);if(t>0)return t}const n=e.attraction_prices;if(Array.isArray(n)&&n.length){const t=n.reduce((i,r)=>i+c(r),0);if(t>0)return t}else if(n&&typeof n=="object"){const i=Object.values(n).reduce((r,o)=>r+c(o),0);if(i>0)return i}const l=c(e==null?void 0:e.attraction_1_price)+c(e==null?void 0:e.attraction_2_price);return l>0?l:0};function L({item:e}){const s=(e==null?void 0:e.name)||(e==null?void 0:e.title)||"Combo deal",n=(e==null?void 0:e.short_description)||(e==null?void 0:e.subtitle)||"",l=(e==null?void 0:e.combo_id)||(e==null?void 0:e.id)||(e==null?void 0:e.slug)||null,t=l?`combo-${l}-left`:`combo-left-${s.replace(/\s+/g,"-").toLowerCase()}`,i=l?`combo-${l}-right`:`combo-right-${s.replace(/\s+/g,"-").toLowerCase()}`,r=v((e==null?void 0:e.attraction_1)||{title:e==null?void 0:e.attraction_1_title,image_url:e==null?void 0:e.attraction_1_image,slug:e==null?void 0:e.attraction_1_slug,base_price:e==null?void 0:e.attraction_1_price},"Experience A",t),o=v((e==null?void 0:e.attraction_2)||{title:e==null?void 0:e.attraction_2_title,image_url:e==null?void 0:e.attraction_2_image,slug:e==null?void 0:e.attraction_2_slug,base_price:e==null?void 0:e.attraction_2_price},"Experience B",i),p=C(e),x=I(e,[r.image_url,o.image_url]),f=k(e,{includeOffers:!1}),d=E(e),u=f>0?f:c(e==null?void 0:e.combo_price)||c(e==null?void 0:e.total_price)||d,h=d>0,g=h&&u>0?Math.max(0,Math.round((1-u/d)*100)):Number((e==null?void 0:e.discount_percent)||0),b=(e==null?void 0:e.combo_id)||(e==null?void 0:e.id)||null,w=b?`/booking?combo_id=${b}&openDrawer=true`:"/booking?openDrawer=true";return a.jsxs("div",{className:`
        group relative flex flex-col rounded-2xl bg-white/90 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 focus:outline-none
      `,children:[a.jsxs("div",{className:"relative aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden",children:[p?a.jsxs("div",{className:"relative h-full w-full overflow-hidden group",children:[a.jsx("img",{src:p,alt:s,className:"h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]",loading:"lazy"}),a.jsxs("div",{className:"absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col gap-1",children:[a.jsx("p",{className:"text-[11px] uppercase tracking-[0.2em] text-gray-200",children:"Includes"}),a.jsxs("div",{className:"text-sm font-semibold text-white flex flex-wrap items-center gap-2",children:[a.jsx("span",{children:r.title}),a.jsx("span",{className:"opacity-70",children:"+"}),a.jsx("span",{children:o.title})]})]})]}):a.jsxs("div",{className:"grid grid-cols-2 h-full gap-0.5 md:gap-1",children:[a.jsxs("div",{className:"relative h-full w-full overflow-hidden group animate-left-in",children:[a.jsx("img",{src:x[0]||r.image_url,alt:r.title,className:`
                  h-full w-full object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.08]
                  group-hover:brightness-110
                `,loading:"lazy"}),a.jsxs("div",{className:`
                absolute inset-x-0 bottom-0 
                bg-gradient-to-t from-black/75 via-black/20 to-transparent
                p-3 backdrop-blur-[2px]
              `,children:[a.jsx("p",{className:"text-[11px] tracking-wide text-gray-200",children:"Experience 1"}),a.jsx("h4",{className:"text-sm font-semibold text-white leading-tight line-clamp-2",children:r.title})]})]}),a.jsxs("div",{className:"relative h-full w-full overflow-hidden group animate-right-in",children:[a.jsx("img",{src:x[1]||o.image_url,alt:o.title,className:`
                  h-full w-full object-cover
                  transition-transform duration-500
                  group-hover:scale-[1.08]
                  group-hover:brightness-110
                `,loading:"lazy"}),a.jsxs("div",{className:`
                absolute inset-x-0 bottom-0 
                bg-gradient-to-t from-black/75 via-black/20 to-transparent
                p-3 backdrop-blur-[2px]
              `,children:[a.jsx("p",{className:"text-[11px] tracking-wide text-gray-200",children:"Experience 2"}),a.jsx("h4",{className:"text-sm font-semibold text-white leading-tight line-clamp-2",children:o.title})]})]})]}),a.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:a.jsx("span",{className:`
              h-10 w-10 rounded-full bg-white/90 text-indigo-700
              text-lg font-bold shadow border flex items-center justify-center
            `,children:"+"})}),a.jsx("span",{className:`
            absolute top-2 left-2 px-2 py-1
            bg-emerald-600 text-white text-[11px] rounded-full shadow
          `,children:"Combo"}),u>0&&a.jsxs("div",{className:`
              absolute bottom-2 left-2 px-3 py-1
              rounded-full bg-black/70 backdrop-blur-md
              text-white text-xs shadow
            `,children:[a.jsx("span",{className:"font-semibold",children:y(u)}),a.jsx("span",{className:"opacity-80",children:" per combo"})]})]}),a.jsxs("div",{className:"p-4",children:[a.jsx("h3",{className:"font-semibold text-gray-900 text-lg line-clamp-1 tracking-tight",children:s}),n?a.jsx("p",{className:"text-sm text-gray-600 mt-1 line-clamp-2",children:n}):null,a.jsxs("div",{className:"mt-2 text-xs text-gray-500 flex flex-wrap gap-2",children:[a.jsx("span",{children:r.title}),a.jsx("span",{children:"+"}),a.jsx("span",{children:o.title})]}),h&&a.jsxs("div",{className:"mt-2 flex items-baseline gap-2 text-sm",children:[a.jsx("div",{className:"line-through text-gray-400",children:y(d)}),a.jsx("div",{className:"text-green-700 font-semibold",children:g>0?`Save ${g}%`:"Combo pricing"})]}),a.jsxs("div",{className:"mt-3 flex items-center gap-3",children:[a.jsx(_,{to:l?`/combos/${l}`:"/combos",className:"text-sm text-blue-600 font-medium hover:text-blue-800 transition",children:"View Combo →"}),a.jsx(_,{to:w,className:"inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-600 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-sky-900/15 hover:bg-sky-700 transition-all duration-200",children:"🎟 Book Now"})]}),a.jsxs("div",{className:"mt-3 flex flex-wrap gap-3 text-xs text-blue-600 font-medium",children:[r.href?a.jsxs(_,{to:r.href,className:"hover:underline",children:["View ",r.title]}):null,o.href?a.jsxs(_,{to:o.href,className:"hover:underline",children:["View ",o.title]}):null]})]}),a.jsx("style",{children:`
        @keyframes leftFullIn {
          0% { opacity: 0; transform: translateX(-120vw) rotate(-45deg); }
          80% { opacity: 1; transform: translateX(12px) rotate(-5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-left-in {
          animation: leftFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }

        @keyframes rightFullIn {
          0% { opacity: 0; transform: translateX(120vw) rotate(45deg); }
          80% { opacity: 1; transform: translateX(-12px) rotate(5deg); }
          100% { opacity: 1; transform: translateX(0) rotate(0deg); }
        }
        .animate-right-in {
          animation: rightFullIn 1s cubic-bezier(.18,.89,.32,1.28) forwards;
        }
      `})]})}export{L as C};

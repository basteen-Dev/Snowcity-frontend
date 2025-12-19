import{j as a,L as y}from"./index-D_x0VcQ4.js";import{f as I}from"./formatters-CmiLqhJj.js";import{g as E}from"./pricing-CIeFTiJd.js";import{i as j}from"./media-DZA-bGGk.js";const v=(n="combo")=>`https://picsum.photos/seed/${n}/640/400`,z=(n,s="combo")=>j(typeof n=="string"&&n?n:v(s)),N=n=>!n&&n!==0?"":j(n,"")||"",S=n=>{if(!n)return"";const s=[n.hero_image,n.banner_image,n.image_web,n.image_mobile,n.image_url,n.cover_image,n.poster_image,n.thumbnail,n.banner_media_id,n.image_media_id,n.cover_media_id,Array.isArray(n.media)?n.media[0]:null,Array.isArray(n.gallery)?n.gallery[0]:null,n.image];for(const l of s){const t=N(l);if(t)return t}return""},$=(n,s=[])=>{var o,r,c,p,f,_,g,d;const l=[],t=new Set,e=h=>{const i=N(h);i&&!t.has(i)&&(t.add(i),l.push(i))};return n&&([(o=n.attraction_1)==null?void 0:o.image_url,n.attraction_1_image,(r=n.attraction_1)==null?void 0:r.cover_image,(c=n.attraction_2)==null?void 0:c.image_url,n.attraction_2_image,(p=n.attraction_2)==null?void 0:p.cover_image,(_=(f=n.attraction_1)==null?void 0:f.media)==null?void 0:_[0],(d=(g=n.attraction_2)==null?void 0:g.media)==null?void 0:d[0]].forEach(e),Array.isArray(n.media)&&n.media.forEach(e),Array.isArray(n.gallery)&&n.gallery.forEach(e)),s.forEach(e),l.slice(0,2)},b=(n,s="Attraction",l="combo-attraction")=>{if(!n||typeof n!="object")return{title:s,image_url:v(l),slug:null,price:0,href:null};const t=n.title||n.name||s,e=n.slug||n.id||n.attraction_id||null,o=Number(n.base_price||n.price||n.amount||0),r=z(n.image_url||n.cover_image||n.image,l);return{title:t,image_url:r,slug:e,price:o,href:e?`/attractions/${e}`:null}},u=n=>{const s=Number(n);return Number.isFinite(s)?s:0},P=n=>{if(!n||typeof n!="object")return 0;const s=u(n.total_price);if(s>0)return s;if(Array.isArray(n.attractions)&&n.attractions.length){const e=n.attractions.reduce((o,r)=>o+u((r==null?void 0:r.price)??(r==null?void 0:r.base_price)??(r==null?void 0:r.amount)),0);if(e>0)return e}if(Array.isArray(n.combo_attractions)&&n.combo_attractions.length){const e=n.combo_attractions.reduce((o,r)=>o+u((r==null?void 0:r.attraction_price)??(r==null?void 0:r.price)),0);if(e>0)return e}const l=n.attraction_prices;if(Array.isArray(l)&&l.length){const e=l.reduce((o,r)=>o+u(r),0);if(e>0)return e}else if(l&&typeof l=="object"){const o=Object.values(l).reduce((r,c)=>r+u(c),0);if(o>0)return o}const t=u(n==null?void 0:n.attraction_1_price)+u(n==null?void 0:n.attraction_2_price);return t>0?t:0};function B({item:n}){const s=(n==null?void 0:n.name)||(n==null?void 0:n.title)||"Combo deal",l=(n==null?void 0:n.short_description)||(n==null?void 0:n.subtitle)||"",t=(n==null?void 0:n.combo_id)||(n==null?void 0:n.id)||(n==null?void 0:n.slug)||null,e=t?`combo-${t}-left`:`combo-left-${s.replace(/\s+/g,"-").toLowerCase()}`,o=t?`combo-${t}-right`:`combo-right-${s.replace(/\s+/g,"-").toLowerCase()}`,r=b((n==null?void 0:n.attraction_1)||{title:n==null?void 0:n.attraction_1_title,image_url:n==null?void 0:n.attraction_1_image,slug:n==null?void 0:n.attraction_1_slug,base_price:n==null?void 0:n.attraction_1_price},"Experience A",e),c=b((n==null?void 0:n.attraction_2)||{title:n==null?void 0:n.attraction_2_title,image_url:n==null?void 0:n.attraction_2_image,slug:n==null?void 0:n.attraction_2_slug,base_price:n==null?void 0:n.attraction_2_price},"Experience B",o),p=S(n),f=$(n,[r.image_url,c.image_url]),_=E(n,{includeOffers:!1}),g=P(n),d=_>0?_:u(n==null?void 0:n.combo_price)||u(n==null?void 0:n.total_price)||g,h=g>0,i=h&&d>0?Math.max(0,Math.round((1-d/g)*100)):Number((n==null?void 0:n.discount_percent)||0),w=t?`/combos/${t}`:"/combos",x=(n==null?void 0:n.combo_id)||(n==null?void 0:n.id)||null,A=x?`/booking?combo_id=${x}&openDrawer=true`:"/booking?openDrawer=true",k=C=>C.stopPropagation();return a.jsxs("div",{className:`
        group relative h-[420px] w-full overflow-hidden rounded-2xl
        bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]
        transition-all duration-300 hover:-translate-y-1
        focus:outline-none cursor-pointer
      `,onClick:()=>window.location.href=w,children:[p?a.jsx("img",{src:p,alt:s,className:`
            absolute inset-0 h-full w-full object-cover
            transition-transform duration-700 group-hover:scale-110
          `,loading:"lazy",decoding:"async"}):a.jsxs("div",{className:"absolute inset-0 grid grid-cols-2",children:[a.jsx("img",{src:f[0]||r.image_url,alt:r.title,className:`
              h-full w-full object-cover
              transition-transform duration-700 group-hover:scale-110
            `,loading:"lazy",decoding:"async"}),a.jsx("img",{src:f[1]||c.image_url,alt:c.title,className:`
              h-full w-full object-cover
              transition-transform duration-700 group-hover:scale-110
            `,loading:"lazy",decoding:"async"})]}),a.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:a.jsx("span",{className:`
            h-10 w-10 rounded-full bg-white/80 text-indigo-700
            text-lg font-bold shadow border border-white/40 flex items-center justify-center
            opacity-90
          `,children:"+"})}),a.jsx("span",{className:`
          absolute top-4 left-4 z-10 rounded-full bg-white/85 px-4 py-1
          text-xs font-semibold text-slate-900 backdrop-blur
        `,children:"Combo"}),d>0&&a.jsxs("div",{className:"absolute top-4 right-4 z-10 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-semibold text-white",children:[I(d),i>0?a.jsxs("span",{className:"ml-1 text-sky-200",children:["-",i,"%"]}):null]}),a.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"}),a.jsxs("div",{className:"absolute bottom-0 z-10 w-full px-5 pb-5 text-white",children:[a.jsx("h3",{className:"text-xl font-semibold leading-tight line-clamp-2",children:s}),l?a.jsx("p",{className:"mt-1 text-sm text-white/80 line-clamp-2",children:l}):null,a.jsxs("div",{className:"mt-2 text-xs text-white/70 flex flex-wrap gap-2",children:[a.jsx("span",{children:r.title}),a.jsx("span",{className:"opacity-80",children:"+"}),a.jsx("span",{children:c.title})]}),h&&i>0?a.jsxs("div",{className:"mt-2 text-xs font-semibold text-emerald-200",children:["Save ",i,"%"]}):null,a.jsx("div",{className:"mt-4 flex items-center justify-center",children:a.jsx(y,{to:A,onClick:k,className:`
              rounded-full bg-sky-400 px-8 py-2.5
              text-sm font-bold text-slate-900
              shadow-lg transition-all
              hover:bg-sky-300
            `,children:"Book Now"})}),a.jsx("div",{className:"sr-only",children:t?a.jsx(y,{to:`/combos/${t}`,children:"View Combo"}):null})]}),a.jsx("style",{children:`
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
      `})]})}export{B as C};

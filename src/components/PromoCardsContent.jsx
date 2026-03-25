import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';
import apiClient from '../services/apiClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useMediaQuery } from '../hooks/useMediaQuery';
export default function PromoCardsContent() {
  const [cards, setCards] = useState([]);
  
  useEffect(() => {
    apiClient.get(endpoints.promoCards.list())
      .then(res => {
        if (res && res.data) {
          setCards(res.data);
        } else if (Array.isArray(res)) {
          setCards(res);
        }
      })
      .catch(err => console.error("Failed to load promo cards", err));
  }, []);

  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!cards.length) return null;

  return (
    <div className="max-w-9xl mx-auto px-2 sm:px-2 lg:px-2 py-2 mb-[36px]">
      <div className="px-2 md:px-4 mb-6 md:mt-8 text-left md:text-center">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">Everyday Specials</h2>
      </div>
      {isMobile ? (
        <div className="premium-carousel">
          <Swiper
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={'auto'}
            centeredSlides={false}
            pagination={{ clickable: true }}
            className="pb-12 pt-2"
          >
            {[...cards].reverse().map(card => {
              const isExternal = card.link_url && card.link_url.startsWith('http');
              const CardContent = (
                <div 
                  className="relative block rounded-2xl overflow-hidden shadow-lg transform transition hover:-translate-y-1 hover:shadow-2xl bg-white dark:bg-slate-800 border-2 border-transparent hover:border-sky-500 w-full"
                  style={{ aspectRatio: '400/660' }}
                >
                   <img src={imgSrc({ web_image: card.image_url })} alt="Promo" className="absolute inset-0 w-full h-full object-cover text-transparent" />
                </div>
              );

              return (
                <SwiperSlide key={card.id} style={{ width: '220px' }}>
                  {isExternal ? (
                    <a href={card.link_url} target="_blank" rel="noopener noreferrer" className="block w-full">{CardContent}</a>
                  ) : (
                    <Link to={card.link_url || '#'} className="block w-full">{CardContent}</Link>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      ) : (
        <div className="flex overflow-x-auto justify-center gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[...cards].reverse().map(card => {
            const isExternal = card.link_url && card.link_url.startsWith('http');
            const CardContent = (
              <div 
                className="relative block rounded-2xl overflow-hidden shadow-lg transform transition hover:-translate-y-1 hover:shadow-2xl bg-white dark:bg-slate-800 border-2 border-transparent hover:border-sky-500 w-full"
                style={{ aspectRatio: '400/660' }}
              >
                 <img src={imgSrc({ web_image: card.image_url })} alt="Promo" className="absolute inset-0 w-full h-full object-cover text-transparent" />
              </div>
            );

            const wrapperClass = "flex-none w-[220px] snap-start";

            if (isExternal) {
               return <a key={card.id} href={card.link_url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>{CardContent}</a>;
            }
            return <Link key={card.id} to={card.link_url || '#'} className={wrapperClass}>{CardContent}</Link>;
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

const testimonials = [
  {
    id: '1',
    name: 'Priya Sharma',
    comment: 'The Snow Park was absolutely incredible. My kids had never seen real snow before — the look on their faces was priceless. Highly recommended for every family in Bangalore!',
    date: 'October 2025',
    avatar: 'P',
    colorClass: 'ra1'
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    comment: 'Best theme park experience in Bangalore. The Eyelusion show was genuinely mind-blowing. Took some incredible photos. Great value for money and spotlessly clean facilities.',
    date: 'October 2025',
    avatar: 'R',
    colorClass: 'ra2'
  },
  {
    id: '3',
    name: 'Anita Desai',
    comment: "Took our whole team here for a corporate outing — absolutely loved the combo experience. Devil's Dark House had everyone screaming. Will definitely be coming back.",
    date: 'September 2025',
    avatar: 'A',
    colorClass: 'ra3'
  }
];

export default function Testimonials() {
  const doubledTestimonials = [...testimonials, ...testimonials];
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="trust-section" ref={ref}>
        <div className="trust-inner">
          <div className={`trust-left ${isVisible ? 'animate-fade-in-left' : 'opacity-0'}`}>
            <span className="eyebrow">✦ What Visitors Say</span>
            <h2 className="section-title" style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.1, fontWeight: 800 }}>
              Thousands of<br />unforgettable<br />moments.
            </h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,.68)', maxWidth: '360px', marginTop: '14px' }}>
              Families, couples, school groups and corporate teams — Snow City is loved by all of Bengaluru.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '48px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: '48px', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-2px' }}>4.6</div>
                <div style={{ color: 'var(--gold, #FFD700)', fontSize: '18px', letterSpacing: '2px', marginTop: '4px' }}>★★★★★</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginTop: '4px', fontWeight: 600 }}>Google Rating</div>
              </div>
              <div style={{ width: '1px', height: '72px', background: 'rgba(255,255,255,.15)' }}></div>
              <div>
                <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>5L+</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginTop: '4px', fontWeight: 600 }}>Happy visitors</div>
              </div>
            </div>
          </div>

          <div className="reviews-container">
            <div className="reviews-stack">
              {doubledTestimonials.map((item, idx) => (
                <div className="review-card" key={`${item.id}-${idx}`}>
                  <div className="review-head">
                    <div className="review-stars">★★★★★</div>
                    <div className="review-source">✓ Google</div>
                  </div>
                  <p className="review-text">"{item.comment}"</p>
                  <div className="review-author">
                    <div className={`review-av ${item.colorClass}`}>{item.avatar}</div>
                    <div>
                      <div className="review-name">{item.name}</div>
                      <div className="review-date">{item.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .trust-section {
          background: linear-gradient(135deg, var(--blue, #003de6) 0%, var(--blue-deep, #0029a3) 100%);
          padding: 72px 60px;
          position: relative; 
          overflow: hidden;
        }
        .trust-section::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 120% at 80% 50%, rgba(14,165,234,.25) 0%, transparent 65%);
          pointer-events: none;
        }
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 80px; align-items: center;
          position: relative; z-index: 2;
        }
        .trust-left .eyebrow { color: rgba(255,255,255,.65); display: block; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; font-size: 13px; }
        
        .reviews-container {
          height: 480px;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
        
        .reviews-stack { 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          animation: verticalScroll 20s linear infinite;
        }
        
        @keyframes verticalScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        .review-card {
          background: rgba(255,255,255,.1);
          border: 1.5px solid rgba(255,255,255,.18);
          border-radius: 20px;
          padding: 20px 22px;
          backdrop-filter: blur(8px);
          transition: background .25s;
        }
        .review-card:hover { background: rgba(255,255,255,.18); }
        .review-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .review-stars { color: #FFD700; font-size: 13px; letter-spacing: 2px; }
        .review-source {
          background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2);
          border-radius: 20px; padding: 3px 10px;
          font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,.8);
          display: flex; align-items: center; gap: 5px;
        }
        .review-text { font-size: 14px; color: rgba(255,255,255,.85); line-height: 1.6; font-style: italic; }
        .review-author {
          display: flex; align-items: center; gap: 10px; margin-top: 14px;
        }
        .review-av {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Red Hat Display', sans-serif;
          font-size: 14px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .ra1 { background: linear-gradient(135deg, #FF8A00, #E52E71); }
        .ra2 { background: linear-gradient(135deg, #00C07A, #0EA5EA); }
        .ra3 { background: linear-gradient(135deg, #7C3AED, #E52E71); }
        .review-name { font-size: 13.5px; font-weight: 700; color: white; }
        .review-date { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }

        @media (max-width: 991px) {
          .trust-section { padding: 60px 40px; }
          .trust-inner { grid-template-columns: 1fr; gap: 48px; }
          .reviews-container { height: 400px; }
        }
        @media (max-width: 767px) {
          .trust-section { padding: 50px 20px; }
        }
      `}</style>
    </>
  );
}
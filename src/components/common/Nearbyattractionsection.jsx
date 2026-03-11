import React, { useState, useEffect, useRef } from 'react';
import funworldHero from '../../assets/images/fun.png';


const stats = [
  { value: '50+', label: 'Rides & Attractions' },
  { value: '30+', label: 'Years of Fun' },
  { value: '1M+', label: 'Happy Visitor' },
];

export default function NearbyAttractionSection() {
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="sec-nearby" ref={ref}>
      <div className="bg-grid" aria-hidden="true" />

      {/* Decorative blobs */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />

      <div className="nearby-container">

        {/* ── Left: Content ── */}
        <div
          className={`nearby-content transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-7'}`}
        >
          {/* Tag */}
          <span className="nearby-eyebrow">
            <span className="eyebrow-dot" />
            Attractions Nearby
          </span>

          {/* Heading */}
          <h2 className="nearby-title">
            Visit Fun World
          </h2>

          {/* Sub */}
          <p className="nearby-tagline">Splash, Spin &amp; Scream</p>
          <p className="nearby-desc">
            Fun World, one of Bangalore's beloved amusement parks, features thrilling rides including
            roller coasters, a Giant Wheel, and exciting carnival games. Don't miss the fantastic
            Water World area, complete with refreshing water slides and wave pools.
          </p>
          <p className="nearby-desc" style={{ marginTop: '12px' }}>
            Combine your Fun World adventure with Snow City for snow-filled fun —
            excellent combo offers and unforgettable family memories await!
          </p>

          {/* Stats row */}
          <div className="stats-row">
            {stats.map((s, i) => (
              <div
                className={`stat-item transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
                key={i}
              >
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="cta-row">
            <a
              href="https://www.funworldblr.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-600 px-8 py-3 text-sm font-semibold text-sky-600 transition-all duration-300 hover:bg-sky-600 hover:text-white"
            >
              View Details
              <span aria-hidden="true">→</span>
            </a>
           
          </div>
        </div>

        {/* ── Right: Hero Image ── */}
        <div
          className={`nearby-hero-wrap transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
        >
          <div className="hero-img-inner">
            <img
              src={funworldHero}
              alt="Fun World Theme Park"
              className="hero-img"
              loading="lazy"
            />
            <div className="hero-img-overlay" />

            {/* Floating elements for depth */}
            <div className="hero-float-badge">
              <span className="badge-dot" />
              Fun World Theme Park
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Tokens ── */
        .sec-nearby {
          --blue: #0099ff;
          --blue-light: #EEF2FF;
          --blue-bg: #F0F9FF;
          --blue-mid: rgba(0, 153, 255, 0.07);
          --ink: #0B1A33;
          --muted: #5C6F8A;
          --border: #D8E4F5;
          --surface: #F7FAFF;
          --white: #FFFFFF;
          --gold: #FFD700;
          --gold-bg: #FFFBEB;
          --green: #0B9B5A;
          --green-bg: #EDFAF3;
          --radius-sm: 10px;
          --radius-md: 14px;
          --radius-lg: 20px;
          --shadow-sm: 0 1px 4px rgba(11,26,51,.06);
          --shadow-md: 0 6px 24px rgba(0, 153, 255, 0.10), 0 1px 4px rgba(0, 153, 255, 0.06);
          --shadow-blue: 0 6px 24px rgba(0, 153, 255, 0.12);
          --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Section ── */
        .sec-nearby {
          position: relative;
          background: var(--white);
          padding: 40px 0 40px 0;
          overflow: hidden;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 153, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 153, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .blob-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0, 153, 255, 0.07), transparent 70%);
          top: -80px; right: -60px;
        }

        .blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0, 153, 255, 0.06), transparent 70%);
          bottom: -60px; left: -40px;
        }

        /* ── Container ── */
        .nearby-container {
          position: relative;
          z-index: 1;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 16px;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 64px;
          align-items: stretch;
        }

        /* ── Eyebrow ── */
        .nearby-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--blue);
          margin-bottom: 16px;
        }

        .eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--blue);
          flex-shrink: 0;
        }

        /* ── Heading ── */
        .nearby-title {
          font-size: clamp(28px, 3.2vw, 38px);
          font-weight: 800;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.025em;
          margin: 0 0 14px;
        }

        .title-accent {
          color: var(--blue);
          position: relative;
        }

        .nearby-tagline {
          font-size: 15px;
          font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin: 0 0 12px;
          font-style: italic;
        }

        .nearby-desc {
          font-size: 14.5px;
          color: var(--muted);
          line-height: 1.7;
          margin: 0;
          max-width: 460px;
        }

        /* ── Stats ── */
        .stats-row {
          display: flex;
          gap: 0;
          margin-top: 24px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--surface);
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 12px;
          border-right: 1.5px solid var(--border);
          gap: 4px;
        }

        .stat-item:last-child { border-right: none; }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--blue);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
          text-align: center;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        /* ── CTA ── */
        .cta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 26px;
          background: var(--orange);
          color: var(--white);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: background var(--transition), box-shadow var(--transition), transform var(--transition);
          box-shadow: 0 4px 16px rgba(0, 153, 255, 0.28);
        }

        .btn-primary:hover {
          background: #007acc;
          box-shadow: var(--shadow-blue);
          transform: translateY(-1px);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--blue);
          text-decoration: none;
          border: 1.5px solid var(--border);
          padding: 11px 18px;
          border-radius: var(--radius-sm);
          transition: border-color var(--transition), background var(--transition);
        }

        .btn-ghost:hover {
          border-color: var(--blue);
          background: var(--blue-light);
        }

        /* ── Hero Image ── */
        .nearby-hero-wrap {
          position: relative;
          width: 100%;
          min-height: 300px;
        }
 
        .hero-img-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
        }
 
        @media (min-width: 769px) {
          .nearby-hero-wrap {
            height: 100%;
            min-height: 0;
          }
          .hero-img-inner {
            position: absolute;
            inset: 0;
          }
        }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s var(--transition);
        }

        .hero-img-inner:hover .hero-img {
          transform: scale(1.04);
        }

        .hero-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(11, 26, 51, 0.4), transparent 60%);
          pointer-events: none;
        }

        .hero-float-badge {
          position: absolute;
          bottom: 24px;
          left: 24px;
          background: var(--white);
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #4ADE80;
          border-radius: 50%;
          box-shadow: 0 0 12px #4ADE80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ─────────────────────────────
           RESPONSIVE — Tablet (≤ 1024px)
        ───────────────────────────── */
        @media (max-width: 1024px) {
          .nearby-container {
            padding: 0 32px;
            gap: 48px;
          }
        }

        /* ─────────────────────────────
           RESPONSIVE — Mobile (≤ 768px)
           md:left-4 md:right-4 → padding: 0 16px
        ───────────────────────────── */
        @media (max-width: 768px) {
          .sec-nearby {
            padding: 64px 0;
          }

          .nearby-container {
            padding: 0 16px;
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .nearby-title {
            font-size: 27px;
          }

          .nearby-desc {
            max-width: 100%;
          }

          .hl-cards {
            grid-template-columns: 1fr 1fr;
          }

          .nearby-hero-wrap {
            min-height: 160px;
            order: -1; /* Image first on mobile */
          }

          .combo-banner {
            flex-wrap: wrap;
            gap: 12px;
          }

          .combo-link {
            width: 100%;
            justify-content: center;
          }
        }

        /* ─────────────────────────────
           RESPONSIVE — Small mobile (≤ 480px)
        ───────────────────────────── */
        @media (max-width: 480px) {
          .sec-nearby {
            padding: 52px 0;
          }

          .nearby-container {
            padding: 0 16px;
          }

          .nearby-title {
            font-size: 24px;
          }

          .stats-row {
            flex-wrap: nowrap;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-label {
            font-size: 10px;
          }

          .nearby-hero-wrap {
            min-height: 134px;
          }

          .hero-float-badge {
            bottom: 16px;
            left: 16px;
            font-size: 11px;
            padding: 8px 14px;
          }

          .hl-card {
            flex-direction: row;
            align-items: flex-start;
            gap: 14px;
          }

          .hl-icon-wrap {
            flex-shrink: 0;
          }

          .cta-row {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-primary, .btn-ghost {
            justify-content: center;
          }

          .badge-inner {
            flex-wrap: wrap;
            gap: 10px;
          }

          .badge-open {
            margin-left: 0;
          }
        }
      `}</style>
    </section>
  );
}
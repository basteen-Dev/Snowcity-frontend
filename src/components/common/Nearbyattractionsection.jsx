import React, { useState } from 'react';
import { motion } from 'framer-motion';
import funworldBanner from '../../assets/images/funworld-desktop-1536x320.webp';

const highlights = [
    {
        icon: '🎢',
        title: 'Thrilling Rides',
        desc: 'Roller coasters, Giant Wheel, and heart-pumping attractions for every thrill level.'
    },
    {
        icon: '🌊',
        title: 'Water World',
        desc: 'Refreshing water slides, wave pools, and splash zones perfect for the whole family.'
    },
    {
        icon: '🎡',
        title: 'Carnival Games',
        desc: 'Classic carnival games, prizes, and fun-filled activities for kids and adults alike.'
    },
    {
        icon: '🎟️',
        title: 'Combo Offers',
        desc: 'Combine your Fun World visit with Snow City for exclusive deals and maximum fun.'
    }
];

const stats = [
    { value: '50+', label: 'Rides & Attractions' },
    { value: '30+', label: 'Years of Fun' },
    { value: '1M+', label: 'Happy Visitor' },
];

export default function NearbyAttractionSection() {
    const [hovered, setHovered] = useState(null);

    return (
        <section className="sec-nearby">
            <div className="bg-grid" aria-hidden="true" />

            {/* Fun World Banner Enhancement */}
            <div className="nearby-banner-wrap">
                <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="nearby-banner-inner"
                >
                    <img
                        src={funworldBanner}
                        alt="Fun World Banner"
                        className="nearby-banner-img"
                    />
                    <div className="banner-overlay" />
                </motion.div>
            </div>

            {/* Decorative blobs */}
            <div className="blob blob-1" aria-hidden="true" />
            <div className="blob blob-2" aria-hidden="true" />

            <div className="nearby-container">

                {/* ── Left: Content ── */}
                <motion.div
                    className="nearby-content"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Tag */}
                    <span className="nearby-eyebrow">
                        <span className="eyebrow-dot" />
                        Attractions Nearby
                    </span>

                    {/* Heading */}
                    <h2 className="nearby-title">
                        Visit Fun World<br />
                        <span className="title-accent">Alongside Snow City</span>
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
                            <motion.div
                                className="stat-item"
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.15 * i + 0.3 }}
                            >
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </motion.div>
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
                        <a
                            href="https://www.funworldblr.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link-hover"
                        >
                            funworldblr.com ↗
                        </a>
                    </div>
                </motion.div>

                {/* ── Right: Highlights grid ── */}
                <motion.div
                    className="highlights-grid"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: 0.14, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Feature badge */}
                    <div className="park-badge">
                        <div className="badge-inner">
                            <span className="badge-emoji">🎠</span>
                            <div>
                                <div className="badge-name">Fun World</div>
                                <div className="badge-loc">📍 Bangalore, KA</div>
                            </div>
                            <span className="badge-open">Open Now</span>
                        </div>
                    </div>

                    {/* Highlight cards */}
                    <div className="hl-cards">
                        {highlights.map((h, idx) => (
                            <motion.div
                                className={`hl-card ${hovered === idx ? 'hl-card--hovered' : ''}`}
                                key={idx}
                                onMouseEnter={() => setHovered(idx)}
                                onMouseLeave={() => setHovered(null)}
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.38, delay: 0.08 * idx + 0.25 }}
                            >
                                <div className="hl-icon-wrap">
                                    <span className="hl-icon">{h.icon}</span>
                                </div>
                                <div className="hl-body">
                                    <div className="hl-title">{h.title}</div>
                                    <div className="hl-desc">{h.desc}</div>
                                </div>
                                <div className="hl-arrow" aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Combo nudge banner */}
                    <motion.div
                        className="combo-banner"
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: 0.55 }}
                    >
                        <span className="combo-icon">❄️</span>
                        <div className="combo-text">
                            <strong>Snow City + Fun World Combo</strong>
                            <span>Save more when you book both experiences together!</span>
                        </div>
                        <a href="/combo-offers" className="combo-link">
                            Get Deal
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </motion.div>
                </motion.div>
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
          padding: 0 0 96px 0; /* Removed top padding to start with banner */
          overflow: hidden;
          border-top: 1px solid var(--border);
        }

        .nearby-banner-wrap {
          width: 100%;
          margin-bottom: 64px;
          overflow: hidden;
          position: relative;
        }

        .nearby-banner-inner {
          width: 100%;
          height: auto;
          aspect-ratio: 1536 / 320;
          position: relative;
        }

        .nearby-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(11, 26, 51, 0.2), transparent 40%, transparent 60%, rgba(11, 26, 51, 0.2));
          pointer-events: none;
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
          align-items: start;
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
          margin-top: 32px;
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
          margin-top: 32px;
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

        /* ── Park badge ── */
        .park-badge {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px 22px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }

        .park-badge::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--blue), var(--gold));
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        }

        .badge-inner {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .badge-emoji {
          font-size: 30px;
          line-height: 1;
          flex-shrink: 0;
        }

        .badge-name {
          font-size: 17px;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .badge-loc {
          font-size: 12.5px;
          color: var(--muted);
          margin-top: 2px;
        }

        .badge-open {
          margin-left: auto;
          background: var(--green-bg);
          color: var(--green);
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 100px;
          border: 1.5px solid rgba(11,155,90,.15);
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        /* ── Highlight cards ── */
        .hl-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .hl-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          transition: border-color var(--transition), background var(--transition), box-shadow var(--transition), transform var(--transition);
          cursor: default;
          overflow: hidden;
        }

        .hl-card--hovered {
          border-color: var(--blue);
          background: var(--blue-bg);
          box-shadow: var(--shadow-blue);
          transform: translateY(-3px);
        }

        .hl-icon-wrap {
          width: 44px; height: 44px;
          border-radius: var(--radius-sm);
          background: var(--gold-bg);
          border: 1.5px solid rgba(232,165,0,.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(232,165,0,.15);
        }

        .hl-icon { font-size: 20px; line-height: 1; }

        .hl-body { flex: 1; }

        .hl-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .hl-desc {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.55;
        }

        .hl-arrow {
          position: absolute;
          top: 14px; right: 14px;
          color: var(--border);
          transition: color var(--transition);
        }

        .hl-card--hovered .hl-arrow {
          color: var(--blue);
        }

        /* ── Combo banner ── */
        .combo-banner {
          background: linear-gradient(135deg, #EEF2FF 0%, #F7FAFF 100%);
          border: 1.5px solid var(--border);
          border-left: 4px solid var(--blue);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .combo-icon {
          font-size: 24px;
          flex-shrink: 0;
          line-height: 1;
        }

        .combo-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .combo-text strong {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .combo-text span {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.4;
        }

        .combo-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--blue);
          color: var(--white);
          font-size: 12.5px;
          font-weight: 700;
          padding: 9px 16px;
          border-radius: 8px;
          text-decoration: none;
          white-space: nowrap;
          transition: background var(--transition), transform var(--transition);
          flex-shrink: 0;
        }

        .combo-link:hover {
          background: #002cb8;
          transform: translateY(-1px);
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

          .hl-cards {
            grid-template-columns: 1fr;
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
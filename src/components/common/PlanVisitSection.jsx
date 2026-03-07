import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: "Do I need to bring warm clothes?",
    a: "No — Snow City provides complimentary jackets, gloves, and snow boots for every visitor inside the Snow Park. Just come as you are!"
  },
  {
    q: "Is Snow Park suitable for toddlers?",
    a: "Yes! Snow City is designed for all ages. Toddlers and young children love the real snow experience. Parental supervision is required inside the Snow Park."
  },
  {
    q: "Can I book tickets at the venue?",
    a: "Yes, walk-in tickets are available. However, booking online saves you ₹100 per person and guarantees your preferred time slot, especially on weekends."
  },
  {
    q: "How long does a typical visit take?",
    a: "Most visitors spend 2–4 hours depending on the experiences chosen. A full combo visit can take up to 4–5 hours."
  },
  {
    q: "Is photography allowed inside?",
    a: "Yes — personal photography and video are welcome throughout Snow City. The Eyelusion zone even encourages you to shoot on your mobile!"
  }
];

const visitItems = [
  {
    icon: '🕙',
    title: 'Park Timings',
    desc: 'Open every day from 10:15 AM to 8:00 PM — including weekends and all public holidays.',
    link: '/park-timings'
  },
  {
    icon: '📍',
    title: 'Getting There',
    desc: 'Easy metro & bus connectivity. On-site parking available. 5 mins from Attiguppe Metro Station.',
    link: '/getting-here'
  },
  {
    icon: '🛡️',
    title: 'Safety Guidelines',
    desc: 'What to wear, health conditions to note, and what to expect inside the snow zone.',
    link: '/safety'
  }
];

const FAQItem = ({ faq, isOpen, onClick }) => (
  <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
    <div className="faq-q" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <span className="faq-txt">{faq.q}</span>
      <div className="faq-icon" aria-hidden="true">
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="answer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="faq-a"
          style={{ overflow: 'hidden' }}
        >
          <p className="faq-a-inner">{faq.a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function PlanVisitSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="sec-faq">
      {/* Subtle background grid */}
      <div className="bg-grid" aria-hidden="true" />

      <div className="faq-container">
        {/* Left: FAQs */}
        <motion.div
          className="faq-col"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="col-header">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Common Questions
            </span>
            <h2 className="col-title">Before You Visit</h2>
            <p className="col-sub">Quick answers to what every visitor asks us.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                faq={faq}
                isOpen={openIndex === idx}
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              />
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="col-divider" aria-hidden="true" />

        {/* Right: Visit Guide */}
        <motion.div
          className="visit-col"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="col-header">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Visitor Guide
            </span>
            <h2 className="col-title">Plan Your Visit</h2>
            <p className="col-sub">Everything you need before stepping in.</p>
          </div>
          <div className="visit-cards">
            {visitItems.map((item, idx) => (
              <motion.div
                className="vq-card"
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * idx + 0.2 }}
              >
                <div className="vq-icon-wrap">
                  <span className="vq-icon" role="img" aria-label={item.title}>{item.icon}</span>
                </div>
                <div className="vq-body">
                  <div className="vq-title">{item.title}</div>
                  <div className="vq-desc">{item.desc}</div>
                  <Link to={item.link} className="vq-link">
                    Learn more
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        /* ── Tokens ── */
        .sec-faq {
          --blue: #0099ff;
          --blue-light: #EEF2FF;
          --blue-mid: rgba(0, 153, 255, 0.08);
          --ink: #0B1A33;
          --ink-2: #253450;
          --muted: #5C6F8A;
          --border: #D8E4F5;
          --surface: #F7FAFF;
          --white: #FFFFFF;
          --gold: #E8A500;
          --gold-bg: #FFF8E6;
          --radius-sm: 10px;
          --radius-md: 14px;
          --radius-lg: 20px;
          --shadow-sm: 0 1px 3px rgba(11,26,51,.06), 0 1px 2px rgba(11,26,51,.04);
          --shadow-md: 0 4px 16px rgba(0,153,255,.10), 0 1px 4px rgba(0,153,255,.06);
          --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Section ── */
        .sec-faq {
          position: relative;
          background: var(--white);
          padding: 96px 0;
          overflow: hidden;
        }

        /* Background grid */
        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,153,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,153,255,.035) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Container ── */
        .faq-container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 1fr 1px 1.15fr;
          gap: 0 56px;
          align-items: start;
        }

        /* ── Column divider ── */
        .col-divider {
          background: linear-gradient(to bottom, transparent, var(--border) 20%, var(--border) 80%, transparent);
          width: 1px;
          align-self: stretch;
          min-height: 300px;
        }

        /* ── Column header ── */
        .col-header {
          margin-bottom: 32px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--blue);
          margin-bottom: 14px;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--blue);
          flex-shrink: 0;
        }

        .col-title {
          font-size: clamp(26px, 3vw, 34px);
          font-weight: 800;
          color: var(--ink);
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }

        .col-sub {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.6;
          margin: 0;
        }

        /* ── FAQ ── */
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .faq-item {
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          transition: border-color var(--transition), box-shadow var(--transition);
          overflow: hidden;
        }

        .faq-item:hover,
        .faq-item--open {
          border-color: var(--blue);
          box-shadow: var(--shadow-md);
        }

        .faq-q {
          padding: 17px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          cursor: pointer;
          user-select: none;
          outline: none;
        }

        .faq-q:focus-visible .faq-icon {
          outline: 2px solid var(--blue);
          outline-offset: 2px;
        }

        .faq-txt {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.45;
          flex: 1;
        }

        .faq-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--blue-light);
          color: var(--blue);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background var(--transition), color var(--transition);
        }

        .faq-item--open .faq-icon,
        .faq-item:hover .faq-icon {
          background: var(--blue);
          color: var(--white);
        }

        .faq-a {
          /* overflow handled inline via motion */
        }

        .faq-a-inner {
          padding: 0 20px 18px;
          font-size: 13.5px;
          color: var(--muted);
          line-height: 1.65;
          margin: 0;
          border-top: 1px solid var(--border);
          padding-top: 14px;
        }

        /* ── Visit cards ── */
        .visit-cards {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .vq-card {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 22px 24px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          transition: border-color var(--transition), background var(--transition), box-shadow var(--transition), transform var(--transition);
          cursor: default;
        }

        .vq-card:hover {
          border-color: var(--blue);
          background: var(--white);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .vq-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          background: var(--gold-bg);
          border: 1.5px solid rgba(232,165,0,.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(232,165,0,.15);
        }

        .vq-icon {
          font-size: 22px;
          line-height: 1;
        }

        .vq-body {
          flex: 1;
          min-width: 0;
        }

        .vq-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--ink);
          margin-bottom: 5px;
          letter-spacing: -0.01em;
        }

        .vq-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.55;
        }

        .vq-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--blue);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          margin-top: 10px;
          transition: gap var(--transition), opacity var(--transition);
        }

        .vq-link:hover {
          gap: 8px;
          opacity: 0.85;
        }

        /* ─────────────────────────────────────────
           RESPONSIVE — Tablet (≤ 1024px)
        ───────────────────────────────────────── */
        @media (max-width: 1024px) {
          .faq-container {
            padding: 0 32px;
            gap: 0 40px;
          }
        }

        /* ─────────────────────────────────────────
           RESPONSIVE — Narrow tablet / large mobile (≤ 768px)
           Key fix: md:left-4 md:right-4 → padding: 0 16px
        ───────────────────────────────────────── */
        @media (max-width: 768px) {
          .sec-faq {
            padding: 64px 0;
          }

          .faq-container {
            /* md:left-4 md:right-4 equivalent — 16px side padding */
            padding: 0 16px;
            grid-template-columns: 1fr;
            gap: 48px 0;
          }

          .col-divider {
            display: none;
          }

          .col-title {
            font-size: 26px;
          }

          .faq-item {
            border-radius: var(--radius-sm);
          }

          .vq-card {
            border-radius: var(--radius-md);
            padding: 18px 18px;
          }
        }

        /* ─────────────────────────────────────────
           RESPONSIVE — Small mobile (≤ 480px)
        ───────────────────────────────────────── */
        @media (max-width: 480px) {
          .sec-faq {
            padding: 52px 0;
          }

          .faq-container {
            padding: 0 16px;
          }

          .col-header {
            margin-bottom: 24px;
          }

          .col-title {
            font-size: 23px;
          }

          .col-sub {
            font-size: 14px;
          }

          .faq-txt {
            font-size: 13.5px;
          }

          .faq-q {
            padding: 15px 16px;
          }

          .faq-a-inner {
            padding: 12px 16px 16px;
            font-size: 13px;
          }

          .vq-card {
            padding: 16px;
            gap: 14px;
          }

          .vq-icon-wrap {
            width: 44px;
            height: 44px;
          }

          .vq-icon {
            font-size: 20px;
          }

          .vq-title {
            font-size: 14px;
          }

          .vq-desc {
            font-size: 12.5px;
          }
        }
      `}</style>
    </section>
  );
}
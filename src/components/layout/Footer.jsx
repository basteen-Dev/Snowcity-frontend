import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { MapPin, Mail, Phone } from "lucide-react";
const Logo = '/logo.png';
import { prioritizeSnowcityFirst } from "../../utils/attractions";

/**
 * Footer Header Component with Accent Underline
 */
const FooterHeader = ({ children }) => (
  <div className="relative mb-4">
    <h4 className="text-[#0099FF] font-normal uppercase tracking-normal text-[12px] leading-[16px]">
      {children}
    </h4>
    <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-[#0099FF]" />
    <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gray-200/50" />
  </div>
);

export default function Footer() {
  const canvasRef = useRef(null);
  const footerRef = useRef(null);

  const attractions = useSelector((s) => s.attractions.items || []);
  const pages = useSelector((s) => s.pages.items || []);

  const topAttractions = prioritizeSnowcityFirst(attractions).slice(0, 6);

  /** OPTIMIZED WIND-DRIVEN SNOW (Canvas) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const isMobile = window.innerWidth < 768;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = 260);

    const maxSnow = isMobile ? 15 : 60;
    const flakes = [];

    for (let i = 0; i < maxSnow; i++) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 3,
        d: Math.random() + 1,
        speedX: 0.5 + Math.random() * 1.5,
        speedY: 0.8 + Math.random() * 1.6,
      });
    }

    let animationId;
    let isVisible = false;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#bae6fd";
      flakes.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });
      update();
    }

    function update() {
      flakes.forEach(f => {
        f.x += f.speedX;
        f.y += f.speedY;
        f.x += Math.sin(f.y * 0.02) * 0.4;
        if (f.y > H || f.x > W + 20) {
          f.x = Math.random() * W;
          f.y = -10;
        }
      });
    }

    function loop() {
      if (!isVisible) { animationId = null; return; }
      draw();
      animationId = requestAnimationFrame(loop);
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animationId) loop();
    }, { threshold: 0.01 });

    if (footerRef.current) observer.observe(footerRef.current);

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = 260;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  const linkClass = "text-[12px] tracking-wider leading-[20px] font-normal hover:text-[#0099FF] transition-colors text-gray-700";

  return (
    <footer ref={footerRef} className="relative bg-gradient-to-t from-[#f5f9ff] to-white mt-0 overflow-hidden">
      {/* Canvas Snow */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-[260px] z-10 pointer-events-none" />

      {/* FOOTER CONTENT */}
      <div className="relative z-30 max-w-[1440px] mx-auto px-6 md:px-12 pt-8 pb-6 mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 text-gray-700">

          {/* COLUMN 1: BRAND & CONTACT */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={Logo} alt="SnowCity" className="h-16 w-auto object-contain" width={120} height={64} />
            </Link>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0099FF] shrink-0 mt-0.5" />
                <p className="text-[12px] leading-[15px] font-light">
                  Jayamahal Road, Fun World Complex, JC Nagar, Bengaluru, Karnataka 560006
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#0099FF] shrink-0" />
                <a href="mailto:info@snowcityblr.com" className="text-[15px] leading-[20px] font-light hover:text-[#0099FF] transition-colors">
                  info@snowcityblr.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#0099FF] shrink-0" />
                <p className="text-[12px] leading-[15px] font-medium text-gray-900">+91 78295 50000</p>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-5 pt-1">
              <a href="https://www.facebook.com/snowcityblr/" className="text-[#1877F2] hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="https://www.youtube.com/@snowcitybangalore" target="_blank" rel="noopener noreferrer" className="text-[#FF0000] hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
              <a href="https://www.instagram.com/snowcitybangalore/" target="_blank" rel="noopener noreferrer" className="text-[#E4405F] hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:contents gap-8">
            {/* COLUMN 2: EXPERIENCES */}
            <div>
              <FooterHeader>Experiences</FooterHeader>
              <ul className="space-y-1 pt-2">
                {topAttractions.map((a, i) => (
                  <li key={i}>
                    <Link to={a.slug ? `/${a.slug}` : `/attractions/${a.id}`} className={linkClass}>
                      {a.name || a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 3: TICKETS */}
            <div>
              <FooterHeader>Tickets</FooterHeader>
              <ul className="space-y-1 pt-2">
                <li><Link to="/tickets-offers" className={linkClass}>Buy tickets</Link></li>
                <li><Link to="/combos" className={linkClass}>Combo Deals</Link></li>
                <li><Link to="/offers" className={linkClass}>Offers</Link></li>
                <li><Link to="/bulk-booking" className={linkClass}>Bulk Booking</Link></li>
                <li><Link to="/tickets-offers" className={linkClass}>Birthday Parties</Link></li>
              </ul>
            </div>

            {/* COLUMN 4: VISIT */}
            <div>
              <FooterHeader>Visit</FooterHeader>
              <ul className="space-y-1 pt-2">
                <li><Link to="/park-timings" className={linkClass}>Park Timings</Link></li>
                <li><Link to="/getting-here" className={linkClass}>Getting Here</Link></li>
                <li><Link to="/faqs" className={linkClass}>FAQS</Link></li>
                <li><Link to="/safety" className={linkClass}>Safety Guidelines</Link></li>
                <li><Link to="/cancellation-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>Cancellation Policy</Link></li>
              </ul>
            </div>

            {/* COLUMN 5: INFORMATION */}
            <div>
              <FooterHeader>Information</FooterHeader>
              <ul className="space-y-1 pt-2">
                <li><Link to="/about-us" className={linkClass}>About Snowcity</Link></li>
                <li><Link to="/contact" className={linkClass}>Contact Us</Link></li>
                <li><Link to="/blog" className={linkClass}>Blog</Link></li>
                <li><Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className={linkClass}>Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className={linkClass}>Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-8 pt-8 border-t border-[#0099FF] text-center">
          <p className="text-xs text-gray-500 font-medium tracking-normal">
            Copyright 2026 © Bengaluru Leisure Private Limited. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

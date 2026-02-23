import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook, Youtube, Instagram, Send } from "lucide-react";
import Logo from "../../assets/images/Logo.webp";

/**
 * Footer Header Component with Accent Underline (VinWonders Style)
 */
const FooterHeader = ({ children }) => (
  <div className="relative mb-6">
    <h4 className="text-slate-900 font-bold uppercase tracking-wider text-base">
      {children}
    </h4>
    <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-blue-100" />
    <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gray-200/50" />
  </div>
);

export default function Footer() {
  const canvasRef = useRef(null);

  /** REALISTIC WIND-DRIVEN SNOW (Canvas High FPS) */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = 260);

    const maxSnow = 90;
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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#bae6fd"; // sky-200 for visibility on white

      flakes.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });

      update();
    }

    function update() {
      flakes.forEach((f) => {
        f.x += f.speedX;
        f.y += f.speedY;
        f.x += Math.sin(f.y * 0.02) * 0.4;

        if (f.y > H || f.x > W + 20) {
          f.x = Math.random() * W;
          f.y = -10;
        }
      });
    }

    let animationId;
    function loop() {
      draw();
      animationId = requestAnimationFrame(loop);
    }

    loop();

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = 260;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <footer className="relative  bg-gradient-to-t from-[#e0f2fe] via-[#bae6fd] to-white mt-0 overflow-hidden ">

      {/* Wave Top Border (Restored) */}
      <div className="absolute -top-[2px] left-0 right-0 z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-[80px] animate-waveSlow opacity-30"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C240,120 480,0 720,50 C960,100 1200,20 1440,60 L1440,0 L0,0 Z"
            fill="#f8fafc" // slate-50
          />
        </svg>
      </div>

      {/* Canvas Snow (Restored) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-[260px] z-10 pointer-events-none"
      ></canvas>

      {/* FOOTER CONTENT (VinWonders Style + SnowCity Data) */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 pt-16 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* COLUMN 1: BRAND & CONTACT */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <img src={Logo} alt="SnowCity" className="h-16 w-auto object-contain" />
            </Link>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  Jayamahal Road, Fun World Complex, JC Nagar, Bengaluru, Karnataka 560006
                </p>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <a href="mailto:info@snowcity.com" className="text-sm hover:text-sky-600 transition-colors">
                  info@snowcityblr.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm font-semibold">
                  Hotline: +91 78295 50000
                </p>
              </div>
            </div>

            {/* Social Icons - Original Brand Colors */}
            <div className="flex items-center gap-6 pt-4">
              <a href="#" className="text-[#1877F2] hover:scale-110 transition-transform" title="Facebook">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@SnowCityBengaluru" target="_blank" rel="noopener noreferrer" className="text-[#FF0000] hover:scale-110 transition-transform" title="YouTube">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/snowcity_blr/" target="_blank" rel="noopener noreferrer" className="text-[#E4405F] hover:scale-110 transition-transform" title="Instagram">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: INTRODUCTION */}
          <div>
            <FooterHeader>Introduction</FooterHeader>
            <ul className="space-y-3 pt-2">
              <li><Link to="/about-us" className="text-sm hover:text-blue-700 transition-colors font-medium">About Us</Link></li>
              <li><Link to="/achievements" className="text-sm hover:text-blue-700 transition-colors font-medium">Achievement</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-blue-700 transition-colors font-medium">Contact</Link></li>
              <li><Link to="/location" className="text-sm hover:text-blue-700 transition-colors font-medium">Maps</Link></li>
              <li><Link to="/careers" className="text-sm hover:text-blue-700 transition-colors font-medium">Career Opportunities</Link></li>
              <li><Link to="/admin" className="text-sm text-sky-800 hover:text-sky-900 transition-colors font-bold mt-4 inline-block">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: EXPLORE */}
          <div>
            <FooterHeader>Explore</FooterHeader>
            <ul className="space-y-3 pt-2">
              <li><Link to="/attractions" className="text-sm hover:text-blue-700 transition-colors font-medium">Attractions</Link></li>
              <li><Link to="/offers" className="text-sm hover:text-blue-700 transition-colors font-medium">Offers & Deals</Link></li>
              <li><Link to="/booking" className="text-sm hover:text-blue-700 transition-colors font-medium">Book Your Visit</Link></li>
              <li><Link to="/faqs" className="text-sm hover:text-blue-700 transition-colors font-medium">FAQs</Link></li>
              <li><Link to="/blog" className="text-sm hover:text-blue-700 transition-colors font-medium">Visitor Stories</Link></li>
              <li><Link to="/safety" className="text-sm hover:text-blue-700 transition-colors font-medium">Safety Guidelines</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: T&C, GALLERY, NEWSLETTER */}
          <div className="space-y-12">
            <div>
              <FooterHeader>Terms & Conditions</FooterHeader>
              <ul className="space-y-3 pt-2">
                <li><Link to="/privacy-policy" className="text-sm hover:text-blue-700 transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" className="text-sm hover:text-blue-700 transition-colors font-medium">Terms & Conditions</Link></li>
              </ul>
            </div>

            <div>
              <FooterHeader>Gallery</FooterHeader>
              <ul className="space-y-3 pt-2">
                <li><Link to="/gallery" className="text-sm hover:text-blue-700 transition-colors font-medium">Photo Gallery</Link></li>
              </ul>
            </div>

          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-6 pt-1 border-t border-gray-300/30 flex flex-col items-center gap-0">
          <p className="text-xs text-gray-500 font-medium leading-none mb-0">
            Copyright 2026 © Bengaluru Leisure Private Limited. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* EXTRA STYLES (Restored for Waves) */}
      <style>{`
        @keyframes waveSlow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-waveSlow {
          animation: waveSlow 20s linear infinite;
        }
      `}</style>
    </footer>
  );
}

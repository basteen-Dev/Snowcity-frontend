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
    <div className="absolute -bottom-2 left-0 w-12 h-[2px] bg-blue-500" />
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
    <footer className="relative  bg-gradient-to-t from-[#e0f2fe] via-[#bae6fd] to-white mt-0 overflow-hidden border-t border-gray-100">

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
      <div className="relative z-30 max-w-7xl mx-auto px-6 py-16">
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
                  info@snowcity.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm font-semibold">
                  Hotline: +91 99999 99999
                </p>
              </div>
            </div>

            {/* Social Icons - Original Brand Colors */}
            <div className="flex items-center gap-6 pt-4">
              <a href="#" className="text-[#1877F2]" title="Facebook">
                <Facebook className="w-5 h-5 fill-current" />
              </a>
              <a href="#" className="text-[#FF0000]" title="YouTube">
                <Youtube className="w-5 h-5 fill-current" />
              </a>
              <a href="#" className="text-[#E4405F]" title="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* COLUMN 2: INTRODUCTION */}
          <div>
            <FooterHeader>Introduction</FooterHeader>
            <ul className="space-y-3 pt-2">
              <li><Link to="/page/about-us" className="text-sm hover:text-blue-700 transition-colors font-medium">About Us</Link></li>
              <li><Link to="/page/achievements" className="text-sm hover:text-blue-700 transition-colors font-medium">Achievement</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-blue-700 transition-colors font-medium">Contact</Link></li>
              <li><Link to="/page/location" className="text-sm hover:text-blue-700 transition-colors font-medium">Maps</Link></li>
              <li><Link to="/page/careers" className="text-sm hover:text-blue-700 transition-colors font-medium">Career Opportunities</Link></li>
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
              <li><Link to="/page/faq" className="text-sm hover:text-blue-700 transition-colors font-medium">FAQs</Link></li>
              <li><Link to="/visitor-blogs" className="text-sm hover:text-blue-700 transition-colors font-medium">Visitor Stories</Link></li>
              <li><Link to="/page/safety" className="text-sm hover:text-blue-700 transition-colors font-medium">Safety Guidelines</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: T&C, GALLERY, NEWSLETTER */}
          <div className="space-y-12">
            <div>
              <FooterHeader>Terms & Conditions</FooterHeader>
              <ul className="space-y-3 pt-2">
                <li><Link to="/page/privacy-policy" className="text-sm hover:text-blue-700 transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link to="/page/terms-and-conditions" className="text-sm hover:text-blue-700 transition-colors font-medium">Terms & Conditions</Link></li>
              </ul>
            </div>

            <div>
              <FooterHeader>Gallery</FooterHeader>
              <ul className="space-y-3 pt-2">
                <li><Link to="/page/about-us#gallery" className="text-sm hover:text-blue-700 transition-colors font-medium">Photo Gallery</Link></li>
              </ul>
            </div>

          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-20 pt-8 border-t border-gray-300/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-medium">
            © {new Date().getFullYear()} SnowCity Theme Park. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500 font-medium">
            <Link to="/page/privacy-policy" className="hover:text-gray-800">Privacy Policy</Link>
            <Link to="/page/terms-and-conditions" className="hover:text-gray-800">Terms & Conditions</Link>
          </div>
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

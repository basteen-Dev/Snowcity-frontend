import React, { useEffect, useRef } from "react";

/**
 * SnowSceneWrapper — Performance-optimized version
 * Uses pre-cached gradient sprite instead of per-flake createRadialGradient.
 * Respects prefers-reduced-motion and pauses when offscreen.
 */
export default function SnowSceneWrapper({
  children,
  className = '',
  waveHeight = 90,
  canvasHeight = 260,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const isMobile = window.innerWidth < 768;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = canvasHeight);

    // Pre-render a gradient flake sprite (avoids createRadialGradient per frame)
    const spriteSize = 16;
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteSize;
    spriteCanvas.height = spriteSize;
    const spriteCtx = spriteCanvas.getContext("2d");
    const halfSprite = spriteSize / 2;
    const g = spriteCtx.createRadialGradient(halfSprite, halfSprite, 0, halfSprite, halfSprite, halfSprite);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0.02)");
    spriteCtx.fillStyle = g;
    spriteCtx.fillRect(0, 0, spriteSize, spriteSize);

    const maxSnow = isMobile ? 30 : Math.min(100, Math.floor(W / 10));
    const flakes = new Array(maxSnow).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 3.5,
      vx: (Math.random() - 0.3) * 1.5,
      vy: 0.6 + Math.random() * 1.8,
      tilt: Math.random() * Math.PI * 2,
      swing: 0.5 + Math.random() * 1.2,
    }));

    let isVisible = true;

    // Pause when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !rafRef.current) draw();
      },
      { threshold: 0.01 }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    function draw() {
      if (!isVisible) { rafRef.current = null; return; }
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const size = f.r * 3;
        ctx.drawImage(spriteCanvas, f.x - size, f.y - size, size * 2, size * 2);
      }

      update();
      rafRef.current = requestAnimationFrame(draw);
    }

    function update() {
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const wind = Math.sin(f.tilt) * f.swing * 0.6;
        f.x += f.vx + wind;
        f.y += f.vy;
        f.tilt += 0.01 + Math.random() * 0.02;

        if (f.y > H + 20 || f.x < -40 || f.x > W + 40) {
          if (Math.random() < 0.2) {
            f.x = Math.random() * W;
            f.y = -10 - Math.random() * 100;
          } else if (Math.random() < 0.5) {
            f.x = -20;
            f.y = Math.random() * H;
          } else {
            f.x = W + 20;
            f.y = Math.random() * H;
          }
          f.vx = (Math.random() - 0.3) * 1.6;
          f.vy = 0.6 + Math.random() * 1.8;
          f.r = 1 + Math.random() * 3.5;
        }
      }
    }

    function onResize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = canvasHeight;
    }

    window.addEventListener("resize", onResize);
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [canvasHeight]);

  const waveSVG = (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#e8f6ff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#d9f0ff" stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d="M0,52 C180,120 360,6 720,56 C1080,106 1260,20 1440,64 L1440,160 L0,160 Z"
        fill="url(#waveGrad)"
      />
    </svg>
  );

  return (
    <div ref={wrapperRef} className="relative overflow-hidden">
      {/* background gradient */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #071226 0%, #072f52 26%, #0d4b7a 48%, #cfeefd 100%)",
        }}
      />

      {/* subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 10%, rgba(255,255,255,0.03), transparent 20%), linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.4))",
        }}
      />

      {/* canvas snow */}
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 left-0 right-0 top-0 z-0 pointer-events-none"
        style={{ height: `${canvasHeight}px` }}
      />

      {/* content */}
      <div className={`relative z-10 font-body ${className}`}>
        {children}
      </div>

      {/* Wave at bottom */}
      <div
        className="absolute left-0 right-0 -bottom-[1px] z-10 overflow-hidden"
        style={{ height: `${waveHeight}px` }}
      >
        <div
          className="wave-track"
          style={{
            display: "flex",
            width: "200%",
            transform: "translate3d(0,0,0)",
          }}
        >
          <div style={{ width: "50%", flex: "0 0 50%" }} className="wave-item">
            {waveSVG}
          </div>
          <div style={{ width: "50%", flex: "0 0 50%" }} className="wave-item">
            {waveSVG}
          </div>
        </div>

        <style>{`
          .wave-track {
            animation: waveScroll 14s linear infinite;
            will-change: transform;
          }
          @keyframes waveScroll {
            0% { transform: translate3d(0,0,0); }
            100% { transform: translate3d(-50%,0,0); }
          }
          .wave-track, .wave-item { pointer-events: none; }
          @media (prefers-reduced-motion: reduce) {
            .wave-track { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

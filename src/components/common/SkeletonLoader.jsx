import React from 'react';

// Skeleton components for different UI elements
export const SkeletonText = ({ lines = 3, className = "", large = false, small = false }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`skeleton ${large ? 'skeleton-text large' : small ? 'skeleton-text small' : 'skeleton-text'}`}
        style={{ width: index === lines - 1 ? '70%' : '100%' }}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = "", height = "200px" }) => (
  <div 
    className={`skeleton skeleton-card ${className}`}
    style={{ height }}
  />
);

export const SkeletonHero = ({ className = "" }) => (
  <div className={`skeleton skeleton-hero ${className}`} />
);

export const SkeletonCircle = ({ className = "", size = "60px" }) => (
  <div 
    className={`skeleton skeleton-circle ${className}`}
    style={{ width: size, height: size }}
  />
);

export const SkeletonButton = ({ className = "", width = "120px" }) => (
  <div 
    className={`skeleton skeleton-button ${className}`}
    style={{ width }}
  />
);

// Carousel skeleton
export const SkeletonCarousel = ({ items = 3, className = "" }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(items, 3)} gap-6 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="space-y-3">
        <SkeletonCard height="250px" />
        <SkeletonText lines={2} />
        <SkeletonButton width="80px" />
      </div>
    ))}
  </div>
);

// Hero section skeleton
export const SkeletonHeroSection = () => (
  <div className="max-w-6xl mx-auto pt-20 md:pt-24 px-3 lg:px-0">
    <div className="rounded-3xl overflow-hidden shadow-xl">
      <SkeletonHero />
    </div>
  </div>
);

// Section header skeleton
export const SkeletonSectionHeader = () => (
  <div className="text-center mb-12">
    <div className="w-32 h-4 skeleton skeleton-text small mx-auto mb-3" />
    <div className="w-64 h-8 skeleton skeleton-text large mx-auto mb-2" />
    <div className="w-96 h-5 skeleton skeleton-text mx-auto" />
  </div>
);

// Testimonial skeleton
export const SkeletonTestimonial = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-4 mb-4">
      <SkeletonCircle size="50px" />
      <div className="flex-1">
        <SkeletonText lines={1} />
        <SkeletonText lines={1} small />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

// Marquee skeleton
export const SkeletonMarquee = () => (
  <div className="bg-gradient-to-r from-sky-50 to-blue-50 py-3 overflow-hidden">
    <div className="flex gap-8 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-48 h-8 skeleton skeleton-text" />
      ))}
    </div>
  </div>
);

// Main skeleton loader component
const SkeletonLoader = ({ type = "default", className = "", ...props }) => {
  switch (type) {
    case "hero":
      return <SkeletonHeroSection className={className} />;
    case "carousel":
      return <SkeletonCarousel className={className} {...props} />;
    case "section-header":
      return <SkeletonSectionHeader className={className} />;
    case "testimonial":
      return <SkeletonTestimonial className={className} />;
    case "marquee":
      return <SkeletonMarquee className={className} />;
    case "card":
      return <SkeletonCard className={className} {...props} />;
    case "text":
      return <SkeletonText className={className} {...props} />;
    case "circle":
      return <SkeletonCircle className={className} {...props} />;
    case "button":
      return <SkeletonButton className={className} {...props} />;
    default:
      return <div className={`w-full h-40 skeleton ${className}`} />;
  }
};

export default SkeletonLoader;

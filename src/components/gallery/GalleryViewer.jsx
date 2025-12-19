import React, { useState, useRef } from 'react';
import { imgSrc } from '../../utils/media';

export default function GalleryViewer({ items = [], initialIndex = 0, onClose = null }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartXRef = useRef(null);
  
  if (!items.length) return null;

  const currentItem = items[currentIndex];
  const isVideo = String(currentItem.media_type || '').toLowerCase() === 'video';
  const mediaUrl = isVideo
    ? imgSrc(currentItem.media_url || currentItem.url || currentItem)
    : imgSrc(currentItem.image_url || currentItem.url || currentItem);
  const posterUrl = imgSrc(currentItem.thumbnail || currentItem.poster_url || null);

  const goToIndex = (index) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => goToIndex(currentIndex - 1);
  const goToNext = () => goToIndex(currentIndex + 1);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape' && onClose) onClose();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      {/* Background tap area for closing */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute inset-0 z-30 md:hidden"
          aria-label="Close gallery"
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="text-sm">
          {currentIndex + 1} / {items.length}
        </div>
        {currentItem.title && (
          <div className="text-center flex-1 px-4">
            <h3 className="font-medium">{currentItem.title}</h3>
            {currentItem.description && (
              <p className="text-xs text-gray-300 mt-1">{currentItem.description}</p>
            )}
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50 relative"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Media Display */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Media */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {isVideo ? (
            <video
              className="max-w-full max-h-full object-contain"
              src={mediaUrl}
              controls
              autoPlay
              poster={posterUrl || undefined}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={currentItem.title || 'Gallery item'}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={currentIndex === items.length - 1}
          className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Number Navigation */}
      <div className="p-4 bg-black/50">
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {items.map((item, index) => (
            <button
              key={item.gallery_item_id || item.id || index}
              onClick={() => goToIndex(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 text-white scale-110'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label={`Go to item ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Swipe Support */}
      <div className="md:hidden">
        <div
          className="absolute inset-0 z-40"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStartXRef.current = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchStartX = touchStartXRef.current;
            
            if (touchStartX !== null) {
              const diff = touchStartX - touchEndX;
              
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  goToNext(); // Swipe left, go next
                } else {
                  goToPrevious(); // Swipe right, go previous
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}

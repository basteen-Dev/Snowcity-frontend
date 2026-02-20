import React, { useState } from 'react';
import GalleryViewer from './GalleryViewer';
import { imgSrc } from '../../utils/media';

export default function GalleryGrid({ items = [], className = "" }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  if (!items.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No gallery items available.
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ${className}`}>
        {items.map((item, index) => {
          const isVideo = String(item.media_type || '').toLowerCase() === 'video';
          const mediaUrl = isVideo
            ? imgSrc(item.media_url || item.url || item)
            : imgSrc(item.image_url || item.url || item);
          const posterUrl = imgSrc(item.thumbnail || item.poster_url || null);

          if (!mediaUrl) {
            return null;
          }

          return (
            <div
              key={item.gallery_item_id || item.id || index}
              className="group relative overflow-hidden rounded-lg cursor-pointer"
              onClick={() => openViewer(index)}
            >
              {/* Thumbnail */}
              <div className="aspect-square relative">
                {isVideo ? (
                  <>
                    <video
                      className="w-full h-full object-cover"
                      src={mediaUrl}
                      poster={posterUrl || undefined}
                      muted
                      preload="metadata"
                    />
                    {/* Video indicator */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    alt={item.image_alt || item.title || 'Gallery item'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                )}

                {/* Number overlay */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </div>

                {/* Title overlay */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="text-white text-xs font-medium truncate">
                      {item.title}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gallery Viewer Modal */}
      {viewerOpen && (
        <GalleryViewer
          items={items}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}
    </>
  );
}

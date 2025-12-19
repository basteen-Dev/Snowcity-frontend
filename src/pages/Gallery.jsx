import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchGallery } from '../features/gallery/gallerySlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';

export default function Gallery() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const gallery = useSelector((s) => s.gallery);

  // Get filter parameters from URL
  const targetType = searchParams.get('target_type');
  const targetRefId = searchParams.get('target_ref_id');
  const attractionId = searchParams.get('attraction');

  // Use attraction parameter as fallback for target_ref_id if target_type is attraction
  const effectiveTargetType = targetType || (attractionId ? 'attraction' : null);
  const effectiveTargetRefId = targetRefId || attractionId;

  React.useEffect(() => {
    const params = { active: true, limit: 100 };
    if (effectiveTargetType) params.target_type = effectiveTargetType;
    if (effectiveTargetRefId) params.target_ref_id = effectiveTargetRefId;
    
    // Check if we need to refetch based on filter changes
    const currentFilters = gallery.filters;
    const filtersChanged = !currentFilters || 
      currentFilters.target_type !== params.target_type ||
      currentFilters.target_ref_id !== params.target_ref_id;
    
    if (gallery.status === 'idle' || filtersChanged) {
      dispatch(fetchGallery(params));
    }
  }, [dispatch, gallery.status, gallery.filters, effectiveTargetType, effectiveTargetRefId]);

  const items = gallery.items || [];

  // Determine page title and description based on filters
  const getPageTitle = () => {
    if (effectiveTargetType === 'attraction' && items.length > 0) {
      const attractionName = items[0]?.target_name;
      return attractionName ? `${attractionName} Gallery` : 'Attraction Gallery';
    }
    return 'Gallery';
  };

  const getPageDescription = () => {
    if (effectiveTargetType === 'attraction') {
      const attractionName = items[0]?.target_name;
      return attractionName
        ? `Explore photos and videos from the ${attractionName} experience at SnowCity.`
        : 'Explore photos and videos from this attraction at SnowCity.';
    }
    return 'Peek into the SnowCity experience with photos and short clips from our visitors.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">{getPageTitle()}</h1>
        <p className="text-gray-600 mt-2">{getPageDescription()}</p>
      </header>

      {gallery.status === 'loading' && !items.length ? <Loader /> : null}
      {gallery.status === 'failed' ? (
        <ErrorState
          message={gallery.error?.message || 'Failed to load gallery'}
          onRetry={() => {
            const params = { active: true, limit: 100 };
            if (effectiveTargetType) params.target_type = effectiveTargetType;
            if (effectiveTargetRefId) params.target_ref_id = effectiveTargetRefId;
            dispatch(fetchGallery(params));
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const isVideo = String(item.media_type || '').toLowerCase() === 'video';
          const mediaUrl = isVideo
            ? imgSrc(item.media_url || item.url || item)
            : imgSrc(item.image_url || item.url || item);
          const posterUrl = imgSrc(item.thumbnail || item.poster_url || null);

          if (!mediaUrl) {
            return null;
          }

          return (
            <figure
              key={item.gallery_item_id || item.id}
              className="group relative overflow-hidden rounded-2xl border shadow-sm bg-white"
            >
              {isVideo ? (
                <video
                  className="w-full h-56 object-cover"
                  src={mediaUrl}
                  controls
                  preload="metadata"
                  poster={posterUrl || undefined}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={item.title || 'Gallery item'}
                  className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              )}
              {(item.title || item.description || item.target_name) ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-sm text-white">
                  {item.title ? <div className="font-medium">{item.title}</div> : null}
                  {item.target_name ? <div className="text-xs opacity-90">{item.target_name}</div> : null}
                  {item.description ? <div className="text-xs opacity-80 mt-1">{item.description}</div> : null}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {!items.length && gallery.status === 'succeeded' ? (
        <div className="py-16 text-center text-gray-500">
          {effectiveTargetType === 'attraction'
            ? "We don't have gallery images for this attraction yet."
            : "We'll be adding gallery highlights soon!"
          }
        </div>
      ) : null}
      </div>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import HtmlContent from '../components/cms/HtmlContent';
import RawFrame from '../components/cms/RawFrame';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGallery } from '../features/gallery/gallerySlice';
import { Link } from 'react-router-dom';
import { imgSrc } from '../utils/media';
import LazyVisible from '../components/common/LazyVisible';
import { SkeletonSectionHeader } from '../components/common/SkeletonLoader';

export default function CMSPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [state, setState] = React.useState({ status: 'idle', page: null, error: null });
  const gallery = useSelector((s) => s.gallery);

  const galleryPhotoItems = React.useMemo(() => {
    return (gallery.items || []).filter(item => String(item.media_type || '').toLowerCase() !== 'video');
  }, [gallery.items]);

  const featuredGalleryImage = React.useMemo(() => {
    const item = galleryPhotoItems[0];
    return item ? imgSrc(item.image_url || item.url) : 'https://picsum.photos/seed/snow-gallery/1280/720';
  }, [galleryPhotoItems]);

  const previewGalleryItems = React.useMemo(() => galleryPhotoItems.slice(0, 4), [galleryPhotoItems]);

  React.useEffect(() => {
    if (slug === 'about-us' && gallery.status === 'idle') {
      dispatch(fetchGallery({ active: true, limit: 50 }));
    }
  }, [slug, gallery.status, dispatch]);

  React.useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    (async () => {
      setState({ status: 'loading', page: null, error: null });
      try {
        const res = await api.get(endpoints.pages.bySlug(slug), { signal: ac.signal });
        const page = res?.page || res || null;
        setState({ status: 'succeeded', page, error: null });
      } catch (err) {
        setState({ status: 'failed', page: null, error: err?.message || 'Failed to load page' });
      }
    })();
    return () => ac.abort();
  }, [slug]);

  if (state.status === 'loading') return <Loader />;
  if (state.status === 'failed') return <ErrorState message={state.error} />;

  const p = state.page || {};
  const mode = (p.editor_mode || '').toLowerCase();
  const title = p.title || p.name || 'Page';
  const isRaw = mode === 'raw';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white w-full px-4 pt-20 pb-10 md:pb-14">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>
        {isRaw ? (
          <RawFrame
            title={title}
            html={p.raw_html || ''}
            css={p.raw_css || ''}
            js={p.raw_js || ''}
            className="w-full min-h-[70vh]"
          />
        ) : p.content_html ? (
          <HtmlContent className="prose prose-lg max-w-none" html={p.content_html} />
        ) : p.content ? (
          <HtmlContent className="prose prose-lg max-w-none" html={p.content} />
        ) : (
          <p className="text-gray-600">No content available.</p>
        )}

        {/* Gallery Extension for About Us */}
        {slug === 'about-us' && (
          <div className="mt-16 pt-16 border-t border-sky-100">
            <LazyVisible minHeight={420} placeholder={<div className="py-8"><SkeletonSectionHeader /></div>}>
              {gallery.status === 'succeeded' && galleryPhotoItems.length > 0 ? (
                <div className="space-y-12">
                  <div className="text-center">
                    <p className="text-sm font-bold tracking-[0.3em] text-sky-500/70 uppercase text-center">CAPTURED MOMENTS</p>
                    <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-slate-900 text-center">Gallery Highlights</h2>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-center">
                      A glimpse of visitors having the time of their lives inside SnowCity.
                    </p>
                  </div>

                  <div className="relative mx-auto max-w-5xl">
                    <div
                      className="relative aspect-video overflow-hidden rounded-2xl shadow-xl"
                      style={{ backgroundImage: `url(${featuredGalleryImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl text-slate-900 shadow-xl">
                            📸
                          </div>
                          <div className="text-2xl font-semibold text-white">Gallery Highlights</div>
                          <div className="text-sm text-white/80 mt-1">Tap to explore memories</div>
                          <Link
                            to="/gallery"
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 transition-all duration-300"
                          >
                            View Full Gallery →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {previewGalleryItems.map((item, idx) => (
                      <div
                        key={`${item.id ?? item.media_id ?? idx}-${idx}`}
                        className="relative h-28 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        <img
                          src={imgSrc(item.image_url || item.url)}
                          alt="snowcity"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                    ))}
                    {galleryPhotoItems.length > previewGalleryItems.length && (
                      <Link
                        to="/gallery"
                        className="relative h-28 rounded-xl border border-dashed border-sky-300 bg-sky-50 flex items-center justify-center text-center text-sky-700 font-bold hover:bg-sky-100 transition-all duration-300"
                      >
                        +{galleryPhotoItems.length - previewGalleryItems.length} more
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}
            </LazyVisible>
          </div>
        )}
      </div>
    </div>
  );
}

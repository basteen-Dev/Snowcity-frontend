import React from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';
import HtmlContent from '../components/cms/HtmlContent';
import RawFrame from '../components/cms/RawFrame';

// Helper function to estimate read time
const getReadTime = (content) => {
  if (!content) return '1 min read';
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Blog() {
  const { slug } = useParams();
  const [st, setSt] = React.useState({ status: 'idle', data: null, error: null });

  React.useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    (async () => {
      setSt({ status: 'loading', data: null, error: null });
      try {
        const res = await api.get(endpoints.blogs.bySlug(slug), { signal: ac.signal });
        const blog = res?.blog || res || null;
        setSt({ status: 'succeeded', data: blog, error: null });
        // Set page title
        document.title = blog?.title || 'Blog';
      } catch (e) {
        setSt({ status: 'failed', data: null, error: e?.message || 'Failed to load blog' });
      }
    })();
    return () => ac.abort();
  }, [slug]);

  if (st.status === 'loading') return <Loader />;
  if (st.status === 'failed') return <ErrorState message={st.error} />;

  const b = st.data || {};
  const cover = imgSrc(b);
  const mode = (b.editor_mode || '').toLowerCase();
  const isRaw = mode === 'raw';
  const readTime = getReadTime(b.content);
  const formattedDate = formatDate(b.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white px-4 pt-20 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Back to blogs link */}
        <div className="mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            {formattedDate && <span>{formattedDate}</span>}
            <span>•</span>
            <span>{readTime}</span>
            {b.section_type && (
              <>
                <span>•</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {b.section_type}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {b.title || 'Blog'}
          </h1>

          {b.author && (
            <div className="flex items-center gap-3">
              <div className="text-gray-600">
                By <span className="font-medium text-gray-900">{b.author}</span>
              </div>
            </div>
          )}
        </header>

        {/* Featured image */}
        {cover && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
            <img
              src={cover}
              alt={b.title}
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Article content */}
        <article className="prose prose-lg max-w-none">
          {isRaw ? (
            <RawFrame
              title={b.title || 'Blog'}
              html={b.raw_html || ''}
              css={b.raw_css || ''}
              js={b.raw_js || ''}
            />
          ) : (
            <HtmlContent html={b.content || ''} />
          )}
        </article>

        {/* Article footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Published on {formattedDate}
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read More Articles
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

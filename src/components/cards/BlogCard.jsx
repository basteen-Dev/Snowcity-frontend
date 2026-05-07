import React from 'react';
import { Link } from 'react-router-dom';
import { imgSrc } from '../../utils/media';
import ImageWithPlaceholder from '../common/ImageWithPlaceholder';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

// Helper to resolve URL
const toBlogUrl = (blog) => {
  if (!blog) return '#';
  if (blog.slug) return `/${blog.slug}`;
  if (blog.blog_id || blog.id) return `/${blog.blog_id || blog.id}`;
  return '#';
};

// Helper function to estimate read time from blog content
const getReadTime = (item) => {
  if (item?.reading_time) return `${item.reading_time} min read`;
  const content = item?.content || item?.raw_html || item?.raw_text || item?.short_description || '';
  if (!content) return '1 min read';
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const BlogCardInner = function BlogCard({ item }) {
  if (!item) return null;

  const cover = imgSrc(item);
  const readTime = getReadTime(item);
  const [remoteReadTime, setRemoteReadTime] = React.useState(null);

  React.useEffect(() => {
    let ac = new AbortController();
    let active = true;

    // If we already have content or explicit reading_time, no need to fetch
    if (item?.reading_time || item?.content || item?.raw_html || item?.raw_text) return () => { };

    const slug = item?.slug;
    const id = item?.blog_id || item?.id;
    const url = slug ? endpoints.blogs.bySlug(slug) : id ? endpoints.blogs.byId(id) : null;
    if (!url) return () => { };

    (async () => {
      try {
        const res = await api.get(url, { signal: ac.signal }).catch(() => null);
        const blog = res?.blog || res || null;
        if (!active || !blog) return;
        const rt = getReadTime(blog);
        setRemoteReadTime(rt);
      } catch (e) {
        // ignore
      }
    })();

    return () => { active = false; ac.abort(); };
  }, [item?.slug, item?.blog_id, item?.id]);
  const formattedDate = formatDate(item.published_at || item.created_at || item.date);
  const title = item.title || 'Blog article';
  const url = toBlogUrl(item);

  const description = item.short_description || item.excerpt ||
    (item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');

  return (
    <article className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
      <Link to={url} className="block flex-1 flex flex-col">
        <div className="relative overflow-hidden shrink-0">
          <ImageWithPlaceholder
            src={cover}
            alt={title}
            wrapperClassName="w-full h-48"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            placeholderClassName="bg-slate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-4 space-y-1">
            {formattedDate && <div>{formattedDate}</div>}
            { (remoteReadTime || readTime) && <div>{remoteReadTime || readTime}</div> }
            {item.section_type && (
              <div className="text-blue-500 font-medium uppercase tracking-wider text-[10px] pt-1">
                {item.section_type}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-4 flex-1">
            {title}
          </h2>

          <div className="mt-auto flex items-center justify-between gap-4">
            <span className="inline-flex items-center text-sm font-medium text-[#0099ff] group-hover:text-blue-700 transition-colors shrink-0">
              Read more
              <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default React.memo(BlogCardInner);

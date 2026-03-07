import React from 'react';
import { Link } from 'react-router-dom';
import { imgSrc } from '../../utils/media';

// Helper to resolve URL
const toBlogUrl = (blog) => {
  if (!blog) return '#';
  if (blog.slug) return `/${blog.slug}`;
  if (blog.blog_id || blog.id) return `/${blog.blog_id || blog.id}`;
  return '#';
};

// Helper to estimate read time
const getReadTime = (content) => {
  if (!content) return '1 min read';
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
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

export default function BlogCard({ item }) {
  if (!item) return null;

  const cover = imgSrc(item);
  const readTime = getReadTime(item.content);
  const formattedDate = formatDate(item.created_at || item.published_at || item.date);
  const title = item.title || 'Blog article';
  const url = toBlogUrl(item);

  const description = item.short_description || item.excerpt ||
    (item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');

  return (
    <article className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
      <Link to={url} className="block flex-1 flex flex-col">
        <div className="relative overflow-hidden shrink-0">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-blue-500 text-4xl">📝</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && readTime && <span>•</span>}
            <span>{readTime}</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-4 flex-1">
            {title}
          </h2>

          <div className="mt-auto flex items-center justify-between">
            <span className="inline-flex items-center text-sm font-medium text-[#0099ff] group-hover:text-blue-700 transition-colors">
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
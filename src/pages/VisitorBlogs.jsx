import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { imgSrc } from '../utils/media';

const toBlogUrl = (blog) => {
  if (!blog) return '#';
  if (blog.slug) return `/${blog.slug}`;
  if (blog.blog_id || blog.id) return `/${blog.blog_id || blog.id}`;
  return '#';
};

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

export default function VisitorBlogs() {
  const dispatch = useDispatch();
  const blogs = useSelector((s) => s.blogs);

  React.useEffect(() => {
    if (blogs.status === 'idle') {
      dispatch(fetchBlogs({ active: true, limit: 12, page: 1 }));
    }
  }, [dispatch, blogs.status]);

  const loadMore = () => {
    const nextPage = blogs.currentPage + 1;
    dispatch(fetchBlogs({ active: true, limit: 12, page: nextPage }));
  };

  const items = blogs.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white px-4 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <p className="uppercase text-xs tracking-[0.3em] text-blue-500 font-medium">Visitor Stories</p>
          <h1 className="text-3xl md:text-5xl font-bold mt-4 text-gray-900">SnowCity Blog</h1>
          <p className="text-gray-600 mt-6 max-w-3xl mx-auto text-lg leading-relaxed">
            Discover tips, behind-the-scenes stories, and guest experiences to make your SnowCity adventure unforgettable.
          </p>
        </header>

        {blogs.status === 'loading' && !items.length ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : null}

        {blogs.status === 'failed' ? (
          <ErrorState
            message={blogs.error?.message || 'Failed to load blogs'}
            onRetry={() => dispatch(fetchBlogs({ active: true, limit: 12, page: 1 }))}
          />
        ) : null}

        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {items.map((blog) => {
              const cover = imgSrc(blog);
              const readTime = getReadTime(blog.content);
              const formattedDate = formatDate(blog.created_at);

              return (
                <article
                  key={blog.blog_id || blog.id || blog.slug}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <Link to={toBlogUrl(blog)} className="block">
                    <div className="relative overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={blog.title || 'Blog post'}
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

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        {formattedDate && <span>{formattedDate}</span>}
                        {formattedDate && readTime && <span>•</span>}
                        <span>{readTime}</span>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-3">
                        {blog.title || 'Blog article'}
                      </h2>

                      {blog.author && (
                        <p className="text-sm text-gray-600 mb-3">
                          By <span className="font-medium">{blog.author}</span>
                        </p>
                      )}

                      {(blog.short_description || blog.excerpt || blog.content) && (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                          {blog.short_description || blog.excerpt ||
                           (blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '')}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                          Read more
                          <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>

                        {blog.section_type && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {blog.section_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {blogs.status !== 'loading' && blogs.hasMore && items.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Load More Articles
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {!items.length && blogs.status === 'succeeded' ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-600">Fresh stories are coming soon. Check back later!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

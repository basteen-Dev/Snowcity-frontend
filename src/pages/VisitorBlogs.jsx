import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogs } from '../features/blogs/blogsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import Pagination from '../components/common/Pagination';
import BlogCard from '../components/cards/BlogCard';
import usePageSeo from '../hooks/usePageSeo';

export default function VisitorBlogs() {
  const dispatch = useDispatch();
  const blogs = useSelector((s) => s.blogs);
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    if (blogs.status === 'idle') {
      dispatch(fetchBlogs({ active: true, limit: 12, page: 1 }));
    }
  }, [dispatch, blogs.status]);

  const handlePageChange = (page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    dispatch(fetchBlogs({ active: true, limit: 12, page, append: false }));
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = blogs.currentPage + 1;
    await dispatch(fetchBlogs({ active: true, limit: 12, page: nextPage, append: true }));
    setLoadingMore(false);
  };

  const items = blogs.items || [];
  const isLoading = blogs.status === 'loading';

  usePageSeo({
    slug: 'blog',
    title: 'Visitor Stories | Snow City Blog',
    description: 'Discover tips, behind-the-scenes stories, and guest experiences to make your SnowCity adventure unforgettable.',
    canonical: window.location.href,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] to-white pt-10 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <p className="uppercase text-xs tracking-[0.3em] text-blue-500 font-medium">Visitor Stories</p>
          <h1 className="text-3xl md:text-5xl font-bold mt-4 text-gray-900">SnowCity Blog</h1>
          <p className="text-gray-600 mt-6 max-w-3xl mx-auto text-lg leading-relaxed">
            Discover tips, behind-the-scenes stories, and guest experiences to make your SnowCity adventure unforgettable.
          </p>
        </header>

        {isLoading && !items.length ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : null}

        {blogs.status === 'failed' ? (
          <ErrorState
            message={blogs.error?.message || 'Failed to load blogs'}
            onRetry={() => dispatch(fetchBlogs({ active: true, limit: 12, page: 1, force: true }))}
          />
        ) : null}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 items-stretch">
              {items.map((blog) => (
                <BlogCard key={blog.blog_id || blog.id || blog.slug} item={blog} />
              ))}
            </div>

            {/* Pagination and Load More */}
            <div className="flex flex-col items-center gap-8 border-t border-gray-100 pt-12">
              <Pagination
                currentPage={blogs.currentPage || 1}
                totalPages={blogs.totalPages || 0}
                onPageChange={handlePageChange}
              />

              {blogs.hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Articles
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-sm text-gray-500">
                    Showing {items.length} of {blogs.totalCount} articles
                  </p>
                </div>
              )}
            </div>
          </>
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

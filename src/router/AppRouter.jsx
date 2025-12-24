import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../components/common/Loader';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
const AdminApp = lazy(() => import('../admin/AdminApp.jsx'));

function safeLazy(factory, FallbackComp) {
  return lazy(() =>
    factory().then((mod) => ({
      default: mod.default || FallbackComp
    }))
  );
}

const Placeholder = ()=><Loader />;


const FallbackPage = () => <Placeholder title="Loading…" />;
const FallbackNav = () => null;
const FallbackFooter = () => <footer className="h-8" />;

const Home = safeLazy(() => import('../pages/Home.jsx'), () => <Placeholder title="Home" />);
const Attractions = safeLazy(() => import('../pages/Attractions.jsx'), () => <Placeholder title="Attractions" />);
const AttractionDetails = safeLazy(() => import('../pages/AttractionDetails.jsx'), () => <Placeholder title="Attraction Details" />);
const Offers = safeLazy(() => import('../pages/Offers.jsx'), () => <Placeholder title="Offers" />);
const Combos = safeLazy(() => import('../pages/Combos.jsx'), () => <Placeholder title="Combos" />);
const ComboDetails = safeLazy(() => import('../pages/ComboDetails.jsx'), () => <Placeholder title="Combo Details" />);
const CMSPage = safeLazy(() => import('../pages/CMSPage.jsx'), () => <Placeholder title="Page" />);
const Contact = safeLazy(() => import('../pages/Contact.jsx'), () => <Placeholder title="Contact" />);
const Booking = safeLazy(() => import('../pages/Booking.jsx'), () => <Placeholder title="Booking" />);
const MyBookings = safeLazy(() => import('../pages/MyBookings.jsx'), () => <Placeholder title="My Bookings" />);
const PaymentReturn = safeLazy(() => import('../pages/PaymentReturn.jsx'), () => <Placeholder title="Payment Return" />);
const PaymentSuccess = safeLazy(() => import('../pages/PaymentSuccess.jsx'), () => <Placeholder title="Payment Success" />);
const NotFound = safeLazy(() => import('../pages/NotFound.jsx'), () => <Placeholder title="Not Found" />);
const BlogDetails = safeLazy(() => import('../pages/Blog.jsx'), () => <Placeholder title="Blog" />);
const Gallery = safeLazy(() => import('../pages/Gallery.jsx'), () => <Placeholder title="Gallery" />);
const VisitorPages = safeLazy(() => import('../pages/VisitorPages.jsx'), () => <Placeholder title="Visitor Guide" />);
const VisitorBlogs = safeLazy(() => import('../pages/VisitorBlogs.jsx'), () => <Placeholder title="Visitor Guide" />);
const FloatingNavBar = safeLazy(() => import('../components/layout/FloatingNavBar.jsx'), FallbackNav);
const Footer = safeLazy(() => import('../components/layout/Footer.jsx'), FallbackFooter);

const SlugRouter = () => {
  const { slug } = useParams();
  const [contentType, setContentType] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkSlug = async () => {
      // Try blog first
      try {
        const res = await api.get(endpoints.blogs.bySlug(slug));
        if (res) {
          setContentType('blog');
          setLoading(false);
          return;
        }
      } catch {}

      // Try combo
      if (slug.startsWith('combo-')) {
        setContentType('combo');
        setLoading(false);
        return;
      }

      // Default to attraction
      setContentType('attraction');
      setLoading(false);
    };

    checkSlug();
  }, [slug]);

  if (loading) return <Placeholder title="Loading…" />;

  if (contentType === 'blog') return <BlogDetails />;
  if (contentType === 'combo') return <ComboDetails />;
  return <AttractionDetails />;
};

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  React.useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, search, hash]);
  return null;
}

function ProtectedRoute() {
  const token = useSelector((s) => s.auth?.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to={`/?authRequired=1`} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function AppLayout() {
  return (
    <>
      <FloatingNavBar />
      <ScrollToTop />
      <main className="min-h-screen bg-white">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FallbackPage />}>
        <Routes>
          {/* 👇 Admin routes are now independent (no public navbar/footer) */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* 👇 Main public layout */}
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="/attractions" element={<Attractions />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/combos" element={<Combos />} />
            <Route path="/combos/:id" element={<ComboDetails />} />
            <Route path="/page/:slug" element={<CMSPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/blog" element={<VisitorBlogs />} />
            <Route path="/visitor-guide/pages" element={<VisitorPages />} />
            <Route path="/visitor-guide/blogs" element={<VisitorBlogs />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/return" element={<PaymentReturn />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/404" element={<NotFound />} />
            
            {/* 👇 Catch-all routes for slugs - combos first, then attractions */}
            <Route path="/:slug" element={<SlugRouter />} />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

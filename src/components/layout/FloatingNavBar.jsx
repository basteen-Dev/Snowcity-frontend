import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, setCredentials } from "../../features/auth/authSlice";
import api from "../../services/apiClient";
import endpoints from "../../services/endpoints";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+65", label: "Singapore (+65)" },
];

/* ---------------- HOOKS ---------------- */

function useClickOutside(ref, onOutside) {
  React.useEffect(() => {
    function handler(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside?.();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside]);
}

function useLockBodyScroll(lock) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}

/* ---------------- COMPONENT ---------------- */

export default function FloatingNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isBookingPage = location.pathname.startsWith("/booking");

  const attractions = useSelector((s) => s.attractions.items || []);
  const offers = useSelector((s) => s.offers.items || []);
  const combos = useSelector((s) => s.combos.items || []);
  const pages = useSelector((s) => s.pages.items || []);
  const user = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);
  const userName = (user?.name || user?.full_name || user?.email || "Guest").trim();
  const userEmail = user?.email || "Not provided";
  const userPhone = user?.phone || user?.mobile || "Not provided";

  const [menuOpen, setMenuOpen] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authForm, setAuthForm] = React.useState({ name: "", email: "", phone: "" });
  const [authCountryCode, setAuthCountryCode] = React.useState("+91");
  const [authPhoneLocal, setAuthPhoneLocal] = React.useState("");
  const [authErrors, setAuthErrors] = React.useState({});
  const [authOtp, setAuthOtp] = React.useState({
    sent: false,
    code: "",
    userId: null,
    debug: "",
    status: "idle",
    error: null,
  });

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const navRef = React.useRef(null);
  useClickOutside(navRef, () => {
    setMenuOpen(null);
    setProfileOpen(false);
  });

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = (key) => setMenuOpen((cur) => (cur === key ? null : key));

  const topAttractions = attractions.slice(0, 12);
  const guidePages = pages.slice(0, 10);

  // Prevent background scroll when mobile menu or auth modal is open
  useLockBodyScroll(mobileOpen || authModalOpen);

  // Premium white navbar styling
  const navLinkBase =
    "px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative group";
  const navLinkTone =
    "text-gray-800 hover:text-sky-600 hover:bg-sky-50";
  const navLinkClass = `${navLinkBase} ${navLinkTone}`;

  const signInButtonClass =
    "inline-flex items-center rounded-full border border-sky-400 px-5 py-2 text-sky-600 font-semibold bg-white hover:bg-sky-50 transition-all duration-300 shadow-sm";

  const bookTicketButtonClass =
    "inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-md transition-all duration-300 hover:shadow-lg";

  const resetAuthState = React.useCallback(() => {
    setAuthForm({ name: "", email: "", phone: "" });
    setAuthCountryCode("+91");
    setAuthPhoneLocal("");
    setAuthErrors({});
    setAuthOtp({
      sent: false,
      code: "",
      userId: null,
      debug: "",
      status: "idle",
      error: null,
    });
  }, []);

  const openAuthModal = React.useCallback(() => {
    resetAuthState();
    setAuthModalOpen(true);
  }, [resetAuthState]);

  const closeAuthModal = React.useCallback(() => {
    setAuthModalOpen(false);
    resetAuthState();
  }, [resetAuthState]);

  const normalizePhone = (s = "") => s.replace(/[^\d+]/g, "");

  const combinedNavPhone = React.useMemo(() => {
    if (!authPhoneLocal) return "";
    return `${authCountryCode}${authPhoneLocal}`;
  }, [authCountryCode, authPhoneLocal]);

  const handleAuthPhoneChange = React.useCallback((value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setAuthPhoneLocal(digits);
    setAuthErrors((prev) => ({ ...prev, phone: undefined }));
  }, []);

  // SEND OTP (name optional, email + phone validated)
  const sendNavOtp = React.useCallback(
    async () => {
      const name = authForm.name.trim(); // optional
      const email = authForm.email.trim();
      const errors = {};

      if (!email) {
        errors.email = "Email is required";
      } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address";
      }

      if (!authPhoneLocal) {
        errors.phone = "Mobile number is required";
      } else if (!/^\d{10}$/.test(authPhoneLocal)) {
        errors.phone = "Enter a valid 10-digit mobile number";
      }

      if (Object.keys(errors).length) {
        setAuthErrors(errors);
        setAuthOtp((prev) => ({ ...prev, error: null }));
        return;
      }

      const phone = normalizePhone(combinedNavPhone);

      try {
        setAuthOtp((prev) => ({ ...prev, status: "sending", error: null }));

        const payload = {
          channel: "sms",
          createIfNotExists: true,
          email,
          phone,
          ...(name && { name }), // only send name if provided
        };

        const res = await api.post(endpoints.auth.otpSend(), payload);

        setAuthOtp((prev) => ({
          ...prev,
          sent: true,
          code: "",
          userId: res?.user_id || null,
          debug: res?.otp || "",
          status: "sent",
          error: null,
        }));
      } catch (err) {
        setAuthOtp((prev) => ({
          ...prev,
          status: "idle",
          error: err?.message || "Failed to send OTP",
        }));
      }
    },
    [authForm, authPhoneLocal, combinedNavPhone]
  );

  // VERIFY OTP (6-digit)
  const verifyNavOtp = React.useCallback(
    async () => {
      const code = (authOtp.code || "").trim();

      if (!/^\d{6}$/.test(code)) {
        setAuthOtp((prev) => ({ ...prev, error: "Enter the 6-digit OTP" }));
        return;
      }

      try {
        setAuthOtp((prev) => ({ ...prev, status: "verifying", error: null }));
        const payload = { otp: code };

        if (authOtp.userId) payload.user_id = authOtp.userId;

        const email = authForm.email.trim();
        const phone = normalizePhone(combinedNavPhone);

        if (!authOtp.userId) {
          if (email) payload.email = email;
          if (phone) payload.phone = phone;
        }

        const res = await api.post(endpoints.auth.otpVerify(), payload);
        if (res?.token) {
          dispatch(
            setCredentials({
              user: res.user || null,
              token: res.token,
              expires_at: res?.expires_at || null,
            })
          );
          closeAuthModal();
        } else {
          setAuthOtp((prev) => ({
            ...prev,
            status: "idle",
            error: "Verification failed",
          }));
        }
      } catch (err) {
        setAuthOtp((prev) => ({
          ...prev,
          status: "idle",
          error: err?.message || "OTP verification failed",
        }));
      }
    },
    [authOtp, authForm, combinedNavPhone, closeAuthModal, dispatch]
  );

  const authModal = authModalOpen ? (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[140] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sign in to SnowCity</h3>
          <button
            className="p-2 rounded-full bg-gray-100 text-gray-500"
            onClick={closeAuthModal}
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter your details once. We&apos;ll create or find your profile and send an OTP
          (testing code 123456).
        </p>
        <div className="space-y-3">
          {/* NAME OPTIONAL */}
          <input
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
            placeholder="Full Name (optional)"
            type="text"
            value={authForm.name}
            onChange={(e) =>
              setAuthForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          {/* EMAIL REQUIRED */}
          <input
            className={`w-full p-3 rounded-xl border focus:border-blue-500 outline-none ${
              authErrors?.email ? "border-red-300" : "border-gray-200"
            }`}
            placeholder="Email"
            type="email"
            required
            autoComplete="email"
            value={authForm.email}
            onChange={(e) => {
              setAuthForm((prev) => ({ ...prev, email: e.target.value }));
              if (authErrors.email)
                setAuthErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
          {authErrors.email && (
            <p className="text-xs text-red-500">{authErrors.email}</p>
          )}

          {/* PHONE REQUIRED */}
          <div className="flex gap-3">
            <div className="relative w-32">
              <select
                className="w-full pl-3 pr-8 p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none appearance-none text-sm font-medium"
                value={authCountryCode}
                onChange={(e) => setAuthCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                ▾
              </span>
            </div>
            <input
              className={`flex-1 p-3 rounded-xl border focus:border-blue-500 outline-none tracking-wide ${
                authErrors?.phone ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="98765 43210"
              type="tel"
              maxLength={10}
              required
              pattern="[0-9]{10}"
              value={authPhoneLocal}
              onChange={(e) => handleAuthPhoneChange(e.target.value)}
            />
          </div>
          {authErrors.phone && (
            <p className="text-xs text-red-500">{authErrors.phone}</p>
          )}

          <button
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black disabled:opacity-60"
            onClick={sendNavOtp}
            disabled={authOtp.status === "sending"}
          >
            {authOtp.status === "sending"
              ? "Sending..."
              : authOtp.sent
              ? "Resend OTP"
              : "Send OTP"}
          </button>

          {authOtp.sent && (
            <div className="flex gap-3 items-center">
              <input
                className="flex-1 p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-center tracking-widest font-mono"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                value={authOtp.code}
                onChange={(e) =>
                  setAuthOtp((prev) => ({ ...prev, code: e.target.value }))
                }
              />
              <button
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={verifyNavOtp}
                disabled={authOtp.status === "verifying"}
              >
                {authOtp.status === "verifying" ? "Verifying..." : "Verify"}
              </button>
            </div>
          )}

          {authOtp.debug && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl p-2">
              Testing OTP:{" "}
              <span className="font-mono font-semibold">{authOtp.debug}</span>
            </div>
          )}
          {authOtp.error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2">
              {authOtp.error}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* FIXED so it overlays hero/banner and behaves like sticky header */}
      <nav
        ref={navRef}
        data-floating-nav
        className={`fixed z-30 transition-all duration-300 ${
          isBookingPage
            ? "top-0 left-0 right-0 w-full translate-x-0"
            : "top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[1400px]"
        }`}
      >
        {/* ------------------- DESKTOP NAV -------------------- */}
        <div
          className={`hidden md:flex items-center justify-between gap-4 px-6 py-3 transition-all duration-300 ${
            isBookingPage
              ? "rounded-none"
              : "rounded-2xl"
          } bg-white/80 backdrop-blur-xl text-gray-900 border border-white/40 shadow-lg`}
          style={{
            boxShadow: isBookingPage 
              ? 'none'
              : '0 8px 32px rgba(31, 38, 135, 0.15)'
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={Logo}
              alt="SnowCity Logo"
              className="h-8 w-auto object-contain brightness-125"
            />
          </Link>

          {/* MENU ITEMS */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link to="/" className={navLinkClass}>
              Home
            </Link>

            {/* Attractions */}
            <div className="relative">
              <button className={navLinkClass} onClick={() => toggleMenu("attr")}>
                Attractions ▾
              </button>
              {menuOpen === "attr" && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <div className="max-h-72 overflow-y-auto">
                    {topAttractions.map((a, idx) => {
                      const attrId = getAttrId(a);
                      const label = a?.name || a?.title || "Attraction";
                      return (
                        <Link
                          key={idx}
                          to={`/attractions/${attrId}`}
                          className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                          onClick={() => setMenuOpen(null)}
                        >
                          {label}
                        </Link>
                      );
                    })}
                    <Link
                      to="/attractions"
                      className="block px-4 py-2.5 text-sky-600 text-sm hover:bg-sky-100 rounded-lg transition-all duration-200 font-semibold border-t border-gray-200 mt-2 pt-3"
                      onClick={() => setMenuOpen(null)}
                    >
                      View All →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Offers */}
            <div className="relative">
              <button className={navLinkClass} onClick={() => toggleMenu("offers")}>
                Offers ▾
              </button>
              {menuOpen === "offers" && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  <Link
                    to="/offers"
                    className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setMenuOpen(null)}
                  >
                    All Offers
                  </Link>
                  <Link
                    to="/combos"
                    className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setMenuOpen(null)}
                  >
                    Combo Deals
                  </Link>
                </div>
              )}
            </div>

            {/* Visitor Guide */}
            <div className="relative">
              <button className={navLinkClass} onClick={() => toggleMenu("guide")}>
                Visitor Guide ▾
              </button>
              {menuOpen === "guide" && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                  {guidePages.map((p, idx) => (
                    <Link
                      key={idx}
                      to={`/page/${p.slug || p.id}`}
                      className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setMenuOpen(null)}
                    >
                      {p.title || p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/contact" className={navLinkClass}>
              Contact Us
            </Link>
            <Link to="/blogs" className={navLinkClass}>
              Blogs
            </Link>

            {!token && (
              <button className={signInButtonClass} onClick={openAuthModal}>
                🔐 Sign In
              </button>
            )}
            <button
              className={bookTicketButtonClass}
              onClick={() => navigate("/booking")}
            >
              🎟️ Book Tickets
            </button>

            {token && (
              <div className="relative">
                <button
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-sky-400 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
                  onClick={() => setProfileOpen((v) => !v)}
                  title={userName}
                >
                  {initial}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <Link
                      to="/my-bookings"
                      className="block px-3 py-2 text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                      onClick={() => setProfileOpen(false)}
                    >
                      📋 My Bookings
                    </Link>
                    <div className="px-3 py-2.5 mt-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                      <p className="font-semibold text-gray-900 text-sm mb-1.5">Account Details</p>
                      <p className="leading-relaxed mb-1">
                        <span className="font-semibold text-gray-800">Name:</span> {userName || "Guest"}
                      </p>
                      <p className="leading-relaxed mb-1">
                        <span className="font-semibold text-gray-800">Phone:</span> {userPhone}
                      </p>
                      <p className="leading-relaxed">
                        <span className="font-semibold text-gray-800">Email:</span> {userEmail}
                      </p>
                    </div>

                    <button
                      className="w-full px-3 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all duration-200"
                      onClick={() => {
                        dispatch(logout());
                        setProfileOpen(false);
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------- MOBILE NAV BAR -------------------- */}
        <div
          className={`md:hidden px-3 py-2.5 flex items-center justify-between transition-all duration-300 ${
            isBookingPage ? "rounded-none" : "rounded-2xl"
          } bg-white/80 backdrop-blur-xl text-gray-900 border border-white/40 shadow-lg`}
          style={{
            boxShadow: isBookingPage 
              ? 'none'
              : '0 8px 32px rgba(31, 38, 135, 0.15)'
          }}
        >
          <button
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-300 hover:scale-105"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>

          <Link to="/" aria-label="Home">
            <img
              src={Logo}
              alt="SnowCity Logo"
              className="h-8 transition brightness-125"
            />
          </Link>

          <div className="relative">
            {token ? (
              <>
                <button
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 text-white hover:from-sky-300 hover:via-blue-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-sky-500/40 hover:shadow-xl hover:scale-110 border border-sky-300/40"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                  title={userName}
                >
                  {initial}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <Link
                      to="/my-bookings"
                      className="block px-3 py-2 text-gray-800 text-sm hover:bg-gray-100 rounded-lg font-medium transition-all duration-200"
                      onClick={() => {
                        setProfileOpen(false);
                        setMobileOpen(false);
                      }}
                    >
                      📋 My Bookings
                    </Link>
                    <div className="px-3 py-2.5 mt-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                      <p className="font-semibold text-gray-900 text-sm mb-1.5">Account Details</p>
                      <p className="leading-relaxed mb-1">
                        <span className="font-semibold text-gray-800">Name:</span> {userName || "Guest"}
                      </p>
                      <p className="leading-relaxed mb-1">
                        <span className="font-semibold text-gray-800">Phone:</span> {userPhone}
                      </p>
                      <p className="leading-relaxed">
                        <span className="font-semibold text-gray-800">Email:</span> {userEmail}
                      </p>
                    </div>

                    <button
                      className="w-full px-3 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all duration-200"
                      onClick={() => {
                        dispatch(logout());
                        setProfileOpen(false);
                        setMobileOpen(false);
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        </div>

        {/* ------------------- MOBILE MENU PANEL -------------------- */}
        {mobileOpen && (
          <div
            className="md:hidden fixed left-2 right-2 top-[4.25rem] z-[120] rounded-2xl px-4 py-4 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto border border-sky-400/30 backdrop-blur-2xl shadow-2xl"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(12, 74, 110, 0.35) 100%)',
              boxShadow: '0 25px 50px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <Link
              to="/"
              className="block py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20"
              onClick={() => setMobileOpen(false)}
            >
              🏠 Home
            </Link>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20 list-none">
                🎢 Attractions
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                {topAttractions.slice(0, 8).map((a, idx) => (
                  <Link
                    key={idx}
                    to={`/attractions/${getAttrId(a)}`}
                    className="block py-2 pl-4 text-sky-200 hover:text-white font-medium hover:bg-sky-500/15 rounded-lg transition-all duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    • {a.name || a.title}
                  </Link>
                ))}
                <Link
                  to="/attractions"
                  className="block py-2 pl-4 text-cyan-300 font-bold hover:bg-sky-500/15 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  → View All
                </Link>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20 list-none">
                🎁 Offers
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                <Link
                  to="/offers"
                  className="block py-2 pl-4 text-sky-200 hover:text-white font-medium hover:bg-sky-500/15 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  • All Offers
                </Link>
                <Link
                  to="/combos"
                  className="block py-2 pl-4 text-sky-200 hover:text-white font-medium hover:bg-sky-500/15 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  • Combo Deals
                </Link>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20 list-none">
                📖 Visitor Guide
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                {guidePages.map((p, idx) => (
                  <Link
                    key={idx}
                    to={`/page/${p.slug || p.id}`}
                    className="block py-2 pl-4 text-sky-200 hover:text-white font-medium hover:bg-sky-500/15 rounded-lg transition-all duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    • {p.title || p.name}
                  </Link>
                ))}
              </div>
            </details>

            <Link
              to="/contact"
              className="block py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20 border-t border-sky-400/20 mt-3 pt-4"
              onClick={() => setMobileOpen(false)}
            >
              📞 Contact Us
            </Link>
            <Link
              to="/blogs"
              className="block py-3 px-4 text-sky-100 hover:text-white font-semibold transition-all duration-200 rounded-lg hover:bg-sky-500/20"
              onClick={() => setMobileOpen(false)}
            >
              📰 Blogs
            </Link>

            <div className="space-y-2 border-t border-sky-400/20 mt-4 pt-4">
              {!token && (
                <button
                  className="w-full py-3 border-2 border-sky-400 text-sky-200 font-bold rounded-full hover:bg-sky-500/20 transition-all duration-300 hover:text-white"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal();
                  }}
                >
                  🔐 Sign In
                </button>
              )}
              <button
                className="w-full py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 text-white font-bold rounded-full hover:from-sky-600 hover:via-blue-600 hover:to-cyan-600 shadow-lg shadow-sky-500/30 transition-all duration-300 hover:scale-105"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/booking");
                }}
              >
                🎟️ Book Tickets
              </button>
            </div>
          </div>
        )}
      </nav>
      {authModal}
    </>
  );
}
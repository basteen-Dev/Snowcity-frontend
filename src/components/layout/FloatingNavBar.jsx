import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, setCredentials } from "../../features/auth/authSlice";
import api from "../../services/apiClient";
import endpoints from "../../services/endpoints";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";
import { Menu, X, Ticket, ChevronDown, User, LogOut, ClipboardList, Home, Mountain, Gift, BookOpen, Phone, Newspaper, Lock } from "lucide-react";
import { prioritizeSnowcityFirst } from "../../utils/attractions";

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
  const isBookingPage = location.pathname.startsWith("/tickets-offers");
  const isHome = location.pathname === "/";
  const attractions = useSelector((s) => s.attractions.items || []);
  const pathSlug = location.pathname.slice(1).split('/')[0];
  const staticRoutes = ["", "attractions", "offers", "combos", "contact", "booking", "gallery", "blog", "visitor-guide", "payment", "my-bookings", "home", "404", "admin", "page"];
  const isDetailPage = !staticRoutes.includes(pathSlug);
  const isFullBlock = isDetailPage;
  const hideNavBarPaths = ['/payment/success', '/payment/return'];
  const shouldHideNavBar = hideNavBarPaths.includes(location.pathname);
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
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  const [authWhatsappConsent, setAuthWhatsappConsent] = React.useState(false);

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

  const topAttractions = prioritizeSnowcityFirst(attractions).slice(0, 12);
  const guidePages = pages.filter((p) => p.nav_group === "visitors_guide").slice(0, 10);

  // Prevent background scroll when mobile menu or auth modal is open
  useLockBodyScroll(mobileOpen || authModalOpen);

  // Premium navbar styling
  const isWhite = true; // Always white as per user request

  const navLinkBase =
    "px-3 py-2 rounded-lg text-sm font-bold tracking-wide relative group";
  const navLinkTone = "text-gray-800 hover:text-sky-600 hover:bg-sky-50";
  const navLinkClass = `${navLinkBase} ${navLinkTone}`;

  const signInButtonClass = "inline-flex items-center rounded-xl border border-sky-400 px-5 py-2 text-sky-600 font-semibold bg-white hover:bg-sky-50 shadow-sm";

  const bookTicketButtonClass =
    "inline-flex items-center rounded-xl px-6 py-2.5 text-sm font-bold bg-[#0099FF] text-white hover:bg-[#007ACC] shadow-md  hover:shadow-lg hover:scale-105 active:scale-95";

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
    setAuthWhatsappConsent(false);
  }, []);

  const openAuthModal = React.useCallback(() => {
    resetAuthState();
    setAuthModalOpen(true);
  }, [resetAuthState]);

  // Listen for global auth modal open events
  React.useEffect(() => {
    const handleOpenAuthModal = () => {
      openAuthModal();
    };
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, [openAuthModal]);

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
          whatsapp_consent: authWhatsappConsent,
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
    async (codeFromAuto) => {
      const code = (typeof codeFromAuto === 'string' ? codeFromAuto : (authOtp.code || "")).trim();

      if (!/^\d{6}$/.test(code)) {
        setAuthOtp((prev) => ({ ...prev, error: "Enter the 6-digit OTP" }));
        return;
      }

      if (!authWhatsappConsent) {
        setAuthOtp((prev) => ({ ...prev, error: "Please agree to WhatsApp notifications to continue" }));
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
          // Include for new user creation
          payload.name = authForm.name.trim() || 'Guest';
          payload.whatsapp_consent = authWhatsappConsent;
        } else {
          // Update consent for existing user
          payload.whatsapp_consent = authWhatsappConsent;
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
          // If user consented to WhatsApp, contact needs to be added manually in Interakt
          if (authWhatsappConsent && res.user?.phone) {
            console.log('User consented to WhatsApp, please add contact manually in Interakt dashboard');
          }
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
            className="p-2 rounded-xl bg-gray-100 text-gray-500"
            onClick={closeAuthModal}
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter your details once. We&apos;ll create or find your profile and send an OTP
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
            className={`w-full p-3 rounded-xl border focus:border-blue-500 outline-none ${authErrors?.email ? "border-red-300" : "border-gray-200"
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
              className={`flex-1 p-3 rounded-xl border focus:border-blue-500 outline-none tracking-wide ${authErrors?.phone ? "border-red-300" : "border-gray-200"
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={authWhatsappConsent}
                onChange={(e) => setAuthWhatsappConsent(e.target.checked)}
                className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 font-medium">
                I agree to receive WhatsApp notifications *
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              We'll send booking confirmations and updates via WhatsApp
            </p>
          </div>

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
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <input
                  className="flex-1 p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-center tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  placeholder="● ● ● ● ● ●"
                  value={authOtp.code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setAuthOtp((prev) => ({ ...prev, code: val }));
                    // Auto-verify when 6 digits are entered
                    if (val.length === 6) {
                      setTimeout(() => {
                        const codeNow = val;
                        if (/^\d{6}$/.test(codeNow)) {
                          // Trigger verify automatically
                          verifyNavOtp(codeNow);
                        }
                      }, 300);
                    }
                  }}
                />
                <button
                  className="inline-flex items-center justify-center rounded-xl bg-[#003de6] text-white px-6 py-3 text-sm font-bold shadow-md hover:bg-[#002db3] transition-all whitespace-nowrap"
                  onClick={verifyNavOtp}
                  disabled={authOtp.status === "verifying" || authOtp.code.length < 6}
                >
                  {authOtp.status === "verifying" ? "Verifying..." : "Verify"}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                OTP will auto-verify once all 6 digits are filled
              </p>
            </div>
          )}

          {authOtp.debug && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl p-2">
              Testing OTP:{" "}
              <span className="font-semibold">{authOtp.debug}</span>
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

  if (shouldHideNavBar) return null;

  return (
    <>
      {/* FIXED TOP NAVBAR */}
      <nav
        ref={navRef}
        data-floating-nav
        className={`fixed z-[150] transition-all duration-500 ease-in-out
          top-0 left-0 right-0 py-2 
          ${scrolled
            ? "bg-white md:bg-white/80 md:backdrop-blur-xl border-b shadow-lg md:top-0 md:rounded-b-2xl md:border"
            : (isHome
              ? "bg-white md:bg-white/50  shadow-sm md:top-2 md:rounded-2xl md:border"
              : "bg-white md:bg-white/70  shadow-md md:top-0 md:rounded-b-xl md:border")} 
          md:left-4 md:right-4 border-white/20`}
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform, background-color, backdrop-filter',
        }}
      >

        {/* ------------------- DESKTOP NAV -------------------- */}
        <div className="hidden md:block px-10 md:px-12">
          <div className={`max-w-[1400px] mx-auto py-1 flex items-center justify-between gap-4`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src={Logo}
                alt="SnowCity Logo"
                className="h-11 w-auto object-contain"
                width={100}
                height={44}
              />
            </Link>

            {/* MENU ITEMS */}
            <div className="flex items-center gap-3 text-sm font-medium">
              {/* Attractions */}
              <div className="relative">
                <button className={navLinkClass} onClick={() => toggleMenu("attr")}>
                  EXPERIENCES <ChevronDown className={`inline w-4 h-4 transition-transform duration-300 ${menuOpen === 'attr' ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen === "attr" && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <div className="max-h-72 overflow-y-auto">
                      {topAttractions.map((a, idx) => {
                        const attrId = getAttrId(a);
                        const label = a?.name || a?.title || "Attraction";
                        const href = a?.slug ? `/${a.slug}` : (attrId ? `/attractions/${attrId}` : '/attractions');
                        return (
                          <Link
                            key={idx}
                            to={href}
                            className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                            onClick={() => setMenuOpen(null)}
                          >
                            {label}
                          </Link>
                        );
                      })}
                      <Link
                        to="/attractions"
                        className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                        onClick={() => setMenuOpen(null)}
                      >
                        All Attractions
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Offers */}
              <div className="relative">
                <button className={navLinkClass} onClick={() => toggleMenu("offers")}>
                  OFFERS <ChevronDown className={`inline w-4 h-4 transition-transform duration-300 ${menuOpen === 'offers' ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen === "offers" && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <Link
                      to="/combos"
                      className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setMenuOpen(null)}
                    >
                      Combo Deals
                    </Link>
                    <Link
                      to="/offers"
                      className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setMenuOpen(null)}
                    >
                      All Offers
                    </Link>

                  </div>
                )}
              </div>

              {/* Visitor Guide */}
              <div className="relative">
                <button className={navLinkClass} onClick={() => toggleMenu("guide")}>
                  VISIT <ChevronDown className={`inline w-4 h-4 transition-transform duration-300 ${menuOpen === 'guide' ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen === "guide" && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <Link to="/park-timing" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium" onClick={() => setMenuOpen(null)}>Park Timing</Link>
                    <Link to="/getting-here" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium" onClick={() => setMenuOpen(null)}>Getting Here</Link>
                    <Link to="/faqs" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium" onClick={() => setMenuOpen(null)}>FAQS</Link>
                    <Link to="/safety" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium" onClick={() => setMenuOpen(null)}>Safety Guidelines</Link>
                    <Link to="/cancellation-policy" className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-sky-100 rounded-lg transition-all duration-200 font-medium" onClick={() => setMenuOpen(null)}>Cancellation Policy</Link>
                  </div>
                )}
              </div>

              <Link to="/contact" className={navLinkClass}>
                CONTACT US
              </Link>
              {!token}
              <button
                className={bookTicketButtonClass}
                onClick={() => { sessionStorage.removeItem('snowcity_booking_state'); navigate('/tickets-offers'); }}
              >
                <Ticket className="w-5 h-5 mr-2" /> BUY TICKETS
              </button>

              {token && (
                <div className="relative">
                  <button
                    className="h-10 w-10 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 shadow-sm"
                    onClick={() => setProfileOpen((v) => !v)}
                    title={userName}
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 z-[110]" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                      <Link
                        to="/my-bookings"
                        className="block px-3 py-2 text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all duration-200"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ClipboardList className="w-4 h-4 inline mr-2 text-blue-600" /> My Bookings
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
                        className="w-full px-3 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all duration-200 text-left"
                        onClick={() => {
                          dispatch(logout());
                          setProfileOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 inline mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`md:hidden h-14 flex items-center justify-between px-3 ${isWhite
            ? "text-gray-900"
            : "text-white"
            }`}
        >
          {/* LEFT: Menu Button */}
          <button
            className="p-2 shrink-0"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* MIDDLE: Logo */}
          <Link to="/" aria-label="Home" className="flex items-center shrink-0">
            <img
              src={Logo}
              alt="SnowCity Logo"
              className="h-9 w-auto object-contain"
              width={80}
              height={36}
            />
          </Link>

          {/* RIGHT: Book Button */}
          <button
            className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-bold bg-[#0099FF] text-white shadow-sm shrink-0"
            onClick={() => {
              setMobileOpen(false);
              sessionStorage.removeItem('snowcity_booking_state');
              navigate('/tickets-offers');
            }}
          >
            <Ticket className="w-4 h-4 mr-1" /> BUY
          </button>
        </div>

        {/* ------------------- MOBILE MENU PANEL -------------------- */}
        {mobileOpen && (
          <div
            className="md:hidden fixed left-0 right-0 top-[calc(3.5rem+1rem)] z-[120] bg-white shadow-lg px-4 py-4 space-y-1 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
          >
            <Link
              to="/"
              className="block py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <Home className="w-5 h-5 inline mr-3 text-blue-600" /> Home
            </Link>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100 list-none">
                <Mountain className="w-5 h-5 inline mr-3 text-blue-600" /> Experiences
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                {topAttractions.slice(0, 8).map((a, idx) => (
                  <Link
                    key={idx}
                    to={a?.slug ? `/${a.slug}` : `/attractions/${getAttrId(a)}`}
                    className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    • {a.name || a.title}
                  </Link>
                ))}
                <Link
                  to="/attractions"
                  className="block py-2 pl-4 text-blue-600 font-bold hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  → View All
                </Link>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100 list-none">
                <Gift className="w-5 h-5 inline mr-3 text-blue-600" /> Offers
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                <Link
                  to="/combos"
                  className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  • Combo Deals
                </Link>
                <Link
                  to="/offers"
                  className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  • All Offers
                </Link>

              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100 list-none">
                <BookOpen className="w-5 h-5 inline mr-3 text-blue-600" /> Visit
              </summary>
              <div className="pl-4 space-y-1 mt-2 pb-3 border-t border-sky-400/20 pt-3">
                <Link to="/park-timing" className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setMobileOpen(false)}>• Park Timing</Link>
                <Link to="/getting-here" className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setMobileOpen(false)}>• Getting Here</Link>
                <Link to="/faqs" className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setMobileOpen(false)}>• FAQS</Link>
                <Link to="/safety" className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setMobileOpen(false)}>• Safety Guidelines</Link>
                <Link to="/cancellation-policy" className="block py-2 pl-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all duration-200" onClick={() => setMobileOpen(false)}>• Cancellation Policy</Link>
              </div>
            </details>

            <Link
              to="/contact"
              className="block py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100 border-t border-sky-400/20 mt-3 pt-4"
              onClick={() => setMobileOpen(false)}
            >
              <Phone className="w-5 h-5 inline mr-3 text-blue-600" /> Contact Us
            </Link>
            <Link
              to="/blog"
              className="block py-3 px-4 text-black hover:text-gray-800 font-semibold transition-all duration-200 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <Newspaper className="w-5 h-5 inline mr-3 text-blue-600" /> Blogs
            </Link>

            {/* Profile Section */}
            {token ? (
              <div className="border-t border-gray-200 mt-3 pt-3">
                <details className="group">
                  <summary className="cursor-pointer py-3 px-4 text-black font-semibold rounded-lg hover:bg-gray-100 list-none flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-3">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
                        <p className="text-xs text-gray-500 leading-tight">{userEmail}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="pl-4 space-y-1 mt-1 pb-2">
                    <div className="px-4 py-2 rounded-lg bg-gray-50 text-xs text-gray-600 space-y-1">
                      <p><span className="font-semibold text-gray-800">Phone:</span> {userPhone}</p>
                      <p><span className="font-semibold text-gray-800">Email:</span> {userEmail}</p>
                    </div>
                    <Link
                      to="/my-bookings"
                      className="block py-2.5 px-4 text-gray-700 hover:text-black font-medium hover:bg-gray-50 rounded-lg transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ClipboardList className="w-4 h-4 inline mr-2 text-blue-600" /> My Bookings
                    </Link>
                    <button
                      className="w-full py-2.5 px-4 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium text-left transition-all"
                      onClick={() => {
                        dispatch(logout());
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 inline mr-2" /> Sign Out
                    </button>
                  </div>
                </details>
              </div>
            ) : (
              <div className="border-t border-gray-200 mt-3 pt-3">
                <button
                  className="w-full py-3 px-4 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 flex items-center transition-all"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal();
                  }}
                >
                  <User className="w-5 h-5 inline mr-3 text-blue-600" /> Sign In
                </button>
              </div>
            )}

            <div className="border-t border-gray-200 mt-2 pt-3">
              <button
                className="w-full py-3 bg-[#003de6] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                onClick={() => {
                  setMobileOpen(false);
                  sessionStorage.removeItem('snowcity_booking_state');
                  navigate("/tickets-offers");
                }}
              >
                <Ticket className="w-5 h-5" /> Book Tickets
              </button>
            </div>
          </div>
        )}
      </nav >
      {authModal}
    </>
  );
}
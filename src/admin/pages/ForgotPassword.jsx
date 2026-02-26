import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [form, setForm] = React.useState({ email: '' });
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    setResult(null);

    const email = form.email.trim();
    if (!email) {
      setStatus('failed');
      setError('Please enter your administrator email address');
      return;
    }

    try {
      const response = await adminApi.post('/api/admin/auth/forgot-password', { email });
      setResult({
        message: response.data?.message || `If an account with email ${email} exists, a password reset link has been sent.`,
        email: response.data?.email || email
      });
      setStatus('success');
    } catch (err) {
      setStatus('failed');
      setError(err?.response?.data?.error || err?.message || 'We encountered an issue sending the reset link. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 font-sans">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6">
              <Mail className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">Check Your Inbox</h1>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
              We&apos;ve dispatched a secure password reset link to:
              <br />
              <span className="font-semibold text-slate-800 break-all">{result.email}</span>
            </p>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-700 font-medium">
                The link will expire in 30 minutes for your security.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                to="/admin/login"
                className="flex items-center justify-center w-full py-3.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Back to Login
              </Link>

              <button
                onClick={() => {
                  setStatus('idle');
                  setResult(null);
                  setError(null);
                }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Try another email address
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-400 text-sm">
            Didn&apos;t receive the email? Check your spam folder or contact technical support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 font-sans">
      <div className="w-full max-w-[440px]">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-lg">S</div>
            <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">SnowCity Admin</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset</h1>
            <p className="text-slate-500 text-[15px]">Enter your administrator email to receive a secure recovery link.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${error ? 'border-red-200 focus:ring-red-500' : 'border-slate-200 focus:ring-slate-900'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400`}
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (error) setError(null);
                  }}
                  placeholder="admin@snowcityblr.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="group relative w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className={`inline-flex items-center gap-2 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
                Send Recovery Link
              </span>
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Return to Login
            </Link>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-400 text-[13px] font-medium tracking-wide uppercase">
            &copy; {new Date().getFullYear()} SnowCity Management
          </p>
        </div>
      </div>
    </div>
  );
}

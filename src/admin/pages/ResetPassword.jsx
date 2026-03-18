import React from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { Lock, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = React.useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  // Redirect if no token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.password) {
      setStatus('failed');
      setError('A new password is required');
      return;
    }

    if (form.password.length < 8) {
      setStatus('failed');
      setError('Password must be at least 8 characters for security');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus('failed');
      setError('The passwords you entered do not match');
      return;
    }

    try {
      const response = await adminApi.post('/api/parkpanel/auth/reset-password', {
        token,
        newPassword: form.password
      });

      setStatus('success');
      setSuccess(response.data?.message || 'Your password has been successfully reset. You can now access your account with the new credentials.');
    } catch (err) {
      setStatus('failed');
      setError(err?.response?.data?.error || err?.message || 'We could not reset your password. The recovery link may be invalid or expired.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 font-sans">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">Password Updated</h1>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
              {success}
            </p>

            <Link
              to="/login"
              className="flex items-center justify-center w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Sign In to Dashboard
            </Link>
          </div>
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
            <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">SnowCity Security</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Password</h1>
            <p className="text-slate-500 text-[15px]">Please set a strong, unique password to secure your administrator account.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-11 pr-12 py-3 bg-slate-50 border ${error ? 'border-red-200 focus:ring-red-500' : 'border-slate-200 focus:ring-slate-900'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400`}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${error ? 'border-red-200 focus:ring-red-500' : 'border-slate-200 focus:ring-slate-900'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400`}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
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
                Update Password
              </span>
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm font-medium text-slate-400 italic">
            Your connection is securely encrypted
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/login"
            className="text-slate-400 hover:text-slate-800 transition-colors text-sm font-semibold"
          >
            Cancel and Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

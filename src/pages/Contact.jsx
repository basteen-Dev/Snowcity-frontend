import React, { useState } from 'react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[0-9+\s-]{8,15}$/;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!form.phone.trim() || !PHONE_REGEX.test(form.phone.trim())) errs.phone = 'Valid phone number is required';
    if (!form.message.trim()) errs.message = 'Message cannot be empty';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post(endpoints.contact.submit(), form);
      toast.success('Your message has been sent successfully!');
      setForm({ name: '', email: '', phone: '', message: '' });
      setErrors({});
    } catch (err) {
      toast.error(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] to-white px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Get in Touch</h1>
        <p className="text-gray-600 mb-8 max-w-lg">Have a question or feedback? Send us a message and our team will get back to you shortly.</p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              className={`w-full rounded-xl border ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#0099FF] focus:ring-[#0099FF]/20'} px-4 py-3 outline-none focus:ring-2 transition-all`}
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: null }); }}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                className={`w-full rounded-xl border ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#0099FF] focus:ring-[#0099FF]/20'} px-4 py-3 outline-none focus:ring-2 transition-all`}
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: null }); }}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                className={`w-full rounded-xl border ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#0099FF] focus:ring-[#0099FF]/20'} px-4 py-3 outline-none focus:ring-2 transition-all`}
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: null }); }}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              className={`w-full rounded-xl border ${errors.message ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#0099FF] focus:ring-[#0099FF]/20'} px-4 py-3 outline-none focus:ring-2 transition-all resize-none`}
              rows={5}
              placeholder="How can we help you?"
              value={form.message}
              onChange={(e) => { setForm({ ...form, message: e.target.value }); if (errors.message) setErrors({ ...errors, message: null }); }}
            />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-[#0099FF] text-white px-8 py-3.5 text-sm font-bold shadow-md hover:bg-[#007ACC] hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : 'Send Message'}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0099FF] mb-2">Our Location</h3>
            <p className="text-sm text-gray-700 font-medium">Jayamahal Road, Fun World Complex,<br />JC Nagar, Bengaluru, Karnataka 560006</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0099FF] mb-2">Phone</h3>
            <a href="tel:+917829550000" className="text-sm text-gray-700 font-medium hover:text-[#0099FF] transition-colors">+91-78295 50000</a>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0099FF] mb-2">Email</h3>
            <a href="mailto:info@snowcityblr.com" className="text-sm text-gray-700 font-medium hover:text-[#0099FF] transition-colors">info@snowcityblr.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
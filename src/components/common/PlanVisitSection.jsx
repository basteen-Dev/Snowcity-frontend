import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, MapPin, Shield, HelpCircle } from 'lucide-react';

const planItems = [
  {
    icon: Clock,
    title: 'Park Timings',
    description: '10:15 am to 8:00 pm | Every day',
    href: '/page/Visitors%20Info'
  },
  {
    icon: MapPin,
    title: 'Getting There',
    description: 'Easy metro & bus connectivity',
    href: '/page/location'
  },
  {
    icon: Shield,
    title: 'Safety Guidelines',
    description: 'What to wear, what to expect',
    href: '/page/safety'
  },
  {
    icon: HelpCircle,
    title: 'FAQs',
    description: 'Answers to popular questions',
    href: '/page/faq'
  }
];

export default function PlanVisitSection() {
  return (
    <section id="plan-visit" className="relative overflow-hidden bg-[#003de6] py-16 px-4">
      {/* Background SVG Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-43c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm20-27c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm58 48c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM79 61c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM54 80c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM66 58c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#003de6]/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold tracking-[0.4em] text-white/50">VISITOR GUIDE</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Plan your visit</h2>
          <p className="mt-3 text-white/70 max-w-2xl mx-auto">
            Everything you need to know before stepping into the SnowCity experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Link
                  to={item.href || '#'}
                  className="group flex h-full flex-col items-center rounded-2xl border border-blue-50 bg-white p-6 text-center shadow-lg transition hover:shadow-2xl"
                >
                  <motion.div
                    className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-slate-900 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="h-8 w-8" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                    Learn more
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    id: '1',
    name: 'Priya Sharma',
    rating: 5,
    comment: 'Amazing experience! The Snow Park was absolutely wonderful. My kids loved every moment. Highly recommended for families!',
    date: 'Oct 2024',
    avatar: '👩'
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    rating: 5,
    comment: 'Best theme park in Bangalore! The Eyelusion show was mind-blowing. Great value for money and super clean facilities.',
    date: 'Oct 2024',
    avatar: '👨'
  },
  {
    id: '3',
    name: 'Anita Desai',
    rating: 5,
    comment: "Visited with friends and had a blast! Devil's Dark House was thrilling. Staff was very helpful and friendly.",
    date: 'Sep 2024',
    avatar: '👩'
  },
  {
    id: '4',
    name: 'Karthik Kumar',
    rating: 4,
    comment: 'Great experience overall! The arcade games section is fantastic. Perfect weekend outing with the family.',
    date: 'Sep 2024',
    avatar: '👨'
  },
  {
    id: '5',
    name: 'Sneha Reddy',
    rating: 5,
    comment: 'Absolutely loved the AR Zoo! Such an innovative concept. My children were amazed and we spent hours there.',
    date: 'Aug 2024',
    avatar: '👩'
  },
  {
    id: '6',
    name: 'Amit Singh',
    rating: 5,
    comment: 'Fantastic place for all ages! Clean, well-maintained, and lots of fun activities. Will definitely visit again!',
    date: 'Aug 2024',
    avatar: '👨'
  }
];

const StarIcon = ({ filled }) => (
  <svg
    className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.954L10 0l2.946 5.956 6.564.954-4.755 4.635 1.123 6.545z" />
  </svg>
);

const QuoteIcon = () => (
  <svg className="h-8 w-8 text-sky-200" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.17 6A4.17 4.17 0 0 0 3 10.17v7.66A1.17 1.17 0 0 0 4.17 19H9a1 1 0 0 0 1-1v-4.83A7.17 7.17 0 0 0 7.17 6Zm9.83 0A4.17 4.17 0 0 0 13 10.17v7.66a1.17 1.17 0 0 0 1.17 1.17H19a1 1 0 0 0 1-1v-4.83A7.17 7.17 0 0 0 17 6Z" />
  </svg>
);

export default function Testimonials() {
  const doubledTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="bg-gradient-to-r from-white via-sky-50 to-cyan-50 py-20 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold tracking-[0.4em] text-sky-600 uppercase">
            WHAT OUR VISITORS SAY
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-extrabold text-sky-900 tracking-tight">
            Loved by families & thrill-seekers
          </h2>
          <p className="mt-4 text-lg text-sky-800/70 max-w-2xl mx-auto">
            Don't just take our word for it — hear from thousands of happy visitors who had an unforgettable time at SnowCity.
          </p>
        </motion.div>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="flex whitespace-nowrap animate-testimonials-marquee py-4">
          {doubledTestimonials.map((testimonial, idx) => (
            <div
              key={`${testimonial.id}-${idx}`}
              className="inline-flex flex-col w-[350px] mx-4 p-8 rounded-2xl border border-sky-200 bg-white/40 backdrop-blur-sm shadow-lg whitespace-normal transition-all duration-300 hover:bg-white/60 hover:border-sky-300"
            >
              <div className="mb-6 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < testimonial.rating} />
                ))}
              </div>

              <div className="relative flex-1 mb-8">
                <div className="absolute -top-4 -left-3 opacity-20 text-sky-300">
                  <QuoteIcon />
                </div>
                <p className="relative z-10 text-sky-900 leading-relaxed italic font-medium">
                  "{testimonial.comment}"
                </p>
              </div>

              <div className="mt-auto flex items-center gap-4 border-t border-sky-100 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl border border-sky-200 shadow-inner shrink-0">
                  {testimonial.avatar}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sky-900 text-lg truncate">{testimonial.name}</div>
                  <div className="text-xs text-sky-600 font-semibold uppercase tracking-wider">{testimonial.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes testimonialsMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-testimonials-marquee {
          animation: testimonialsMarquee 60s linear infinite;
        }
        .animate-testimonials-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
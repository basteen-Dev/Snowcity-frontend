import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const toSlugUrl = (page) => {
    if (!page) return '#';
    if (page.slug) {
        let slug = page.slug;
        if (slug.startsWith('/page/')) slug = slug.substring(6);
        else if (slug.startsWith('page/')) slug = slug.substring(5);
        return `/${slug}`;
    }
    if (page.page_id || page.id) return `/${page.page_id || page.id}`;
    return '#';
};

export default function NavigationAccordion() {
    const [isOpen, setIsOpen] = useState(false);
    const pages = useSelector((s) => s.pages);
    const items = (pages.items || []).filter(p => p.nav_group === 'more_info');

    if (pages.status === 'failed') return null;
    // Allow rendering the header even if items are still loading or empty for now to verify UI

    return (
        <section className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full py-6 flex items-center gap-3 group transition-all"
                >
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">More info</h3>
                    <ChevronDown
                        size={20}
                        className={`text-gray-400 group-hover:text-sky-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-height-500 opacity-100 pb-10' : 'max-height-0 opacity-0'
                        }`}
                    style={{ maxHeight: isOpen ? '500px' : '0px' }}
                >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        {items.length > 0 ? items.map((page, idx) => (
                            <React.Fragment key={page.page_id || page.id || page.slug}>
                                <Link
                                    to={toSlugUrl(page)}
                                    className="hover:text-sky-600 font-medium transition-colors py-1"
                                >
                                    {page.title || page.name}
                                </Link>
                                {idx < items.length - 1 && (
                                    <span className="text-gray-300" aria-hidden="true">|</span>
                                )}
                            </React.Fragment>
                        )) : (
                            <p className="py-2 italic opacity-60">No pages tagged as "More info" in Admin Panel.</p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .max-height-0 { max-height: 0; }
        .max-height-500 { max-height: 500px; }
      `}</style>
        </section>
    );
}

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import AttractionCard from '../cards/AttractionCard';
import ComboCard from '../cards/ComboCard';

export default function NavigationAccordion() {
    const [isOpen, setIsOpen] = useState(false);
    const pages = useSelector((s) => s.pages);
    const attractions = useSelector((s) => s.attractions?.items || []);
    const combos = useSelector((s) => s.combos?.items || []);
    const items = (pages.items || [])
        .filter(p => p.placement === 'section_more_info' && p.active !== false)
        .sort((a, b) => (a.nav_order || 0) - (b.nav_order || 0));

    if (pages.status === 'failed' || !items.length) return null;

    return (
        <section className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full py-6 flex items-center justify-between group transition-all"
                >
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">Related Information</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-400 group-hover:text-sky-600 transition-colors">
                            {isOpen ? 'Show Less' : 'Explore More'}
                        </span>
                        <ChevronDown
                            size={20}
                            className={`text-gray-400 group-hover:text-sky-600 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                <div
                    className={`nav-acc-content transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 pb-12' : 'opacity-0'}`}
                    style={{
                        display: 'grid',
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                    }}
                >
                    <div style={{ overflow: 'hidden' }}>
                        <div className="more-info-sections">
                            {items.map((page) => (
                                <MoreInfoSection
                                    key={page.page_id || page.id || page.slug}
                                    page={page}
                                    attractions={attractions}
                                    combos={combos}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .nav-acc-content {
                    transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
                }
                .more-info-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .more-info-block {
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .more-info-block-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    padding: 20px 24px 0;
                    margin: 0;
                }
                .more-info-block-content {
                    padding: 16px 24px 24px;
                    font-size: 14px;
                    color: #475569;
                    line-height: 1.7;
                }
                .more-info-block-content h1,
                .more-info-block-content h2,
                .more-info-block-content h3,
                .more-info-block-content h4 {
                    color: #0f172a;
                    font-weight: 700;
                    margin: 20px 0 10px;
                }
                .more-info-block-content h1 { font-size: 22px; }
                .more-info-block-content h2 { font-size: 18px; }
                .more-info-block-content h3 { font-size: 16px; }
                .more-info-block-content p {
                    margin-bottom: 12px;
                }
                .more-info-block-content ul,
                .more-info-block-content ol {
                    padding-left: 20px;
                    margin-bottom: 12px;
                }
                .more-info-block-content ul { list-style-type: disc; }
                .more-info-block-content ol { list-style-type: decimal; }
                .more-info-block-content li {
                    margin-bottom: 4px;
                }
                .more-info-block-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 12px 0;
                }
                .more-info-block-content a {
                    color: #0284c7;
                    text-decoration: underline;
                }
                .more-info-block-content a:hover {
                    color: #0369a1;
                }
                .more-info-block-content strong,
                .more-info-block-content b {
                    font-weight: 700;
                    color: #1e293b;
                }
                .more-info-block-content em,
                .more-info-block-content i {
                    font-style: italic;
                }
                .more-info-block-content blockquote {
                    border-left: 3px solid #38bdf8;
                    padding-left: 16px;
                    margin: 12px 0;
                    color: #64748b;
                    font-style: italic;
                }
                .more-info-block-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 12px 0;
                }
                .more-info-block-content th,
                .more-info-block-content td {
                    border: 1px solid #e2e8f0;
                    padding: 8px 12px;
                    text-align: left;
                }
                .more-info-block-content th {
                    background: #f1f5f9;
                    font-weight: 700;
                    color: #0f172a;
                }
                .more-info-linked-card {
                    margin-top: 20px;
                    padding: 0 24px 24px;
                    overflow: hidden;
                }
                .more-info-linked-card .exp-card-new,
                .more-info-linked-card .exp-featured {
                    margin: 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
            `}</style>
        </section>
    );
}

function MoreInfoSection({ page, attractions, combos }) {
    const linkedItem = React.useMemo(() => {
        if (!page.section_type || page.section_type === 'none' || !page.section_ref_id) return null;
        if (page.section_type === 'attraction') {
            return attractions.find(a => (a.attraction_id || a.id) === Number(page.section_ref_id));
        }
        if (page.section_type === 'combo') {
            return combos.find(c => (c.combo_id || c.id) === Number(page.section_ref_id));
        }
        return null;
    }, [page, attractions, combos]);

    return (
        <div className="more-info-block">
            {page.title && (
                <h4 className="more-info-block-title">{page.title}</h4>
            )}
            <div className="more-info-block-content">
                {page.editor_mode === 'raw' ? (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: page.raw_html || '' }} />
                        {page.raw_css && <style>{page.raw_css}</style>}
                    </>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
                )}
            </div>
            {linkedItem && (
                <div className="more-info-linked-card">
                    {page.section_type === 'attraction' ? (
                        <AttractionCard item={linkedItem} />
                    ) : (
                        <ComboCard item={linkedItem} />
                    )}
                </div>
            )}
        </div>
    );
}

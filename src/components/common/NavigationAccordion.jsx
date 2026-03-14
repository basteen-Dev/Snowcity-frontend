import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import AttractionCard from '../cards/AttractionCard';
import ComboCard from '../cards/ComboCard';

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
    const attractions = useSelector((s) => s.attractions?.items || []);
    const combos = useSelector((s) => s.combos?.items || []);
    const items = (pages.items || []).filter(p => p.placement === 'more_info');

    if (pages.status === 'failed') return null;

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {items.length > 0 ? items.map((page) => (
                                <SubAccordionItem
                                    key={page.page_id || page.id || page.slug}
                                    page={page}
                                    attractions={attractions}
                                    combos={combos}
                                />
                            )) : (
                                <p className="py-2 italic opacity-60">No additional information sections available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .nav-acc-content {
                    transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
                }
                .sub-acc-item {
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: all 0.3s ease;
                    overflow: hidden;
                }
                .sub-acc-item:hover {
                    border-color: #38bdf8;
                    background: #ffffff;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                .sub-acc-header {
                    width: 100%;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    text-align: left;
                    outline: none;
                }
                .sub-acc-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .sub-acc-body {
                    display: grid;
                    transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .sub-acc-inner {
                    overflow: hidden;
                    padding: 0 20px 20px;
                    font-size: 14px;
                    color: #475569;
                    line-height: 1.6;
                }
                .sub-acc-inner h1, .sub-acc-inner h2, .sub-acc-inner h3 {
                    color: #0f172a;
                    font-weight: 700;
                    margin: 16px 0 8px;
                }
                .sub-acc-inner p {
                    margin-bottom: 12px;
                }
                .sub-acc-inner ul {
                    list-style-type: disc;
                    padding-left: 20px;
                    margin-bottom: 12px;
                }
                .sub-acc-inner img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 12px 0;
                }
                .sub-acc-linked-card {
                    margin-top: 20px;
                    overflow: hidden;
                }
                /* Ensure cards look good inside the accordion */
                .sub-acc-linked-card .exp-card-new,
                .sub-acc-linked-card .exp-featured {
                    margin: 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
            `}</style>
        </section>
    );
}

function SubAccordionItem({ page, attractions, combos }) {
    const [isOpen, setIsOpen] = useState(false);

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
        <div className={`sub-acc-item ${isOpen ? 'active-sub-acc' : ''}`}>
            <button className="sub-acc-header" onClick={() => setIsOpen(!isOpen)}>
                <span className="sub-acc-title">{page.title || page.name}</span>
                <ChevronDown
                    size={16}
                    className={`text-sky-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className="sub-acc-body"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="sub-acc-inner">
                    {page.editor_mode === 'raw' ? (
                        <>
                            <div dangerouslySetInnerHTML={{ __html: page.raw_html || '' }} />
                            {page.raw_css && <style>{page.raw_css}</style>}
                            {page.raw_js && <script dangerouslySetInnerHTML={{ __html: page.raw_js }} />}
                        </>
                    ) : (
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    )}
                    {linkedItem && (
                        <div className="sub-acc-linked-card">
                            {page.section_type === 'attraction' ? (
                                <AttractionCard item={linkedItem} />
                            ) : (
                                <ComboCard item={linkedItem} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

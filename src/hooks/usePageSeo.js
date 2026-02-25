import { useEffect, useRef } from 'react';

/**
 * usePageSeo — React hook for client-side SEO meta tag injection.
 * Sets document.title, creates/updates meta tags, and injects JSON-LD schema.
 * All elements are cleaned up on unmount or when data changes.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.keywords
 * @param {string} opts.image
 * @param {string} opts.imageAlt
 * @param {string} opts.canonical
 * @param {string} opts.type — 'blog' | 'page' | 'website'
 * @param {string} opts.author
 * @param {Array}  opts.faq_items — [{question, answer}]
 * @param {object} opts.head_schema
 * @param {object} opts.body_schema
 * @param {object} opts.footer_schema
 */
export default function usePageSeo({
    title = '',
    description = '',
    keywords = '',
    image = '',
    imageAlt = '',
    canonical = '',
    type = 'website',
    author = '',
    faq_items = [],
    head_schema = null,
    body_schema = null,
    footer_schema = null,
} = {}) {
    const createdElements = useRef([]);

    useEffect(() => {
        // Clean up previous elements
        createdElements.current.forEach(el => {
            try { el.parentNode?.removeChild(el); } catch { /* ignore */ }
        });
        createdElements.current = [];

        if (!title) return;

        // Set document title
        const prevTitle = document.title;
        document.title = title;

        // Helper: create or update a meta tag
        function setMeta(name, content, isProperty = false) {
            if (!content) return;
            const attr = isProperty ? 'property' : 'name';
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
                createdElements.current.push(el);
            }
            el.setAttribute('content', content);
        }

        // Standard meta
        setMeta('description', description);
        if (keywords) setMeta('keywords', keywords);
        if (author) setMeta('author', author);

        // Open Graph
        setMeta('og:type', type === 'blog' ? 'article' : 'website', true);
        setMeta('og:title', title, true);
        setMeta('og:description', description, true);
        if (image) setMeta('og:image', image, true);
        if (canonical) setMeta('og:url', canonical, true);

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title);
        setMeta('twitter:description', description);
        if (image) setMeta('twitter:image', image);
        if (imageAlt) setMeta('twitter:image:alt', imageAlt);

        // Canonical link
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
                createdElements.current.push(link);
            }
            link.setAttribute('href', canonical);
        }

        // JSON-LD: FAQ Schema
        const validFaqs = (faq_items || []).filter(f => f && f.question && f.answer);
        if (validFaqs.length) {
            const faqSchema = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: validFaqs.map(f => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: f.answer,
                    },
                })),
            };
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(faqSchema);
            script.setAttribute('data-seo', 'faq');
            document.head.appendChild(script);
            createdElements.current.push(script);
        }

        // Helper to inject arbitrary JSON-LD schemas or RAW HTML/SCRIPTS
        const injectSchema = (schemaData, dataSeoTag, targetNode = document.head) => {
            if (!schemaData) return;

            // If it looks like HTML (contains <script, <meta, <link, etc), inject it as-is
            if (typeof schemaData === 'string' && /<[a-z][\s\S]*>/i.test(schemaData)) {
                const div = document.createElement('div');
                div.innerHTML = schemaData;
                Array.from(div.childNodes).forEach(node => {
                    if (node.nodeType === 1) { // Element
                        const newNode = document.createElement(node.tagName);
                        Array.from(node.attributes).forEach(attr => newNode.setAttribute(attr.name, attr.value));
                        if (node.tagName.toLowerCase() === 'script') {
                            newNode.textContent = node.textContent;
                        } else {
                            newNode.innerHTML = node.innerHTML;
                        }
                        newNode.setAttribute('data-seo', dataSeoTag);
                        targetNode.appendChild(newNode);
                        createdElements.current.push(newNode);
                    }
                });
                return;
            }

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo', dataSeoTag);

            if (typeof schemaData === 'string') {
                try {
                    // test if it's valid JSON
                    JSON.parse(schemaData);
                    script.textContent = schemaData;
                } catch {
                    // not valid JSON, ignore
                    return;
                }
            } else if (typeof schemaData === 'object' && Object.keys(schemaData).length) {
                script.textContent = JSON.stringify(schemaData);
            } else {
                return;
            }

            targetNode.appendChild(script);
            createdElements.current.push(script);
        };

        injectSchema(head_schema, 'custom-schema', document.head);
        injectSchema(body_schema, 'body-schema', document.body);
        injectSchema(footer_schema, 'footer-schema', document.body);

        return () => {
            document.title = prevTitle;
            createdElements.current.forEach(el => {
                try { el.parentNode?.removeChild(el); } catch { /* ignore */ }
            });
            createdElements.current = [];
        };
    }, [title, description, keywords, image, imageAlt, canonical, type, author, faq_items, head_schema, body_schema, footer_schema]);
}

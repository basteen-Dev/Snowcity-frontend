import { useEffect, useRef } from 'react';
import api from '../services/apiClient';

export function useSiteSettings() {
    const containerRef = useRef([]);

    useEffect(() => {
        let mounted = true;

        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/site-settings/seo');
                if (!mounted) return;

                const settings = res?.data || res || {};

                // Remove previous injected scripts
                if (containerRef.current && containerRef.current.length) {
                    containerRef.current.forEach(el => {
                        try { el.parentNode?.removeChild(el); } catch { }
                    });
                }
                containerRef.current = [];

                // Helper to inject HTML strings
                const injectHtml = (htmlString, targetNode, prepend = false) => {
                    if (!htmlString || typeof htmlString !== 'string') return;

                    const template = document.createElement('template');
                    template.innerHTML = htmlString.trim();

                    const nodes = Array.from(template.content.childNodes);

                    // To preserve order when prepending, we iterate in reverse
                    const iterateNodes = prepend ? [...nodes].reverse() : nodes;

                    iterateNodes.forEach(node => {
                        let processedNode = node;

                        // Re-create script tags so they execute
                        if (node.tagName === 'SCRIPT') {
                            processedNode = document.createElement('script');
                            Array.from(node.attributes).forEach(attr => processedNode.setAttribute(attr.name, attr.value));
                            processedNode.textContent = node.textContent;
                        } else {
                            processedNode = node.cloneNode(true);
                        }

                        if (prepend && targetNode.firstChild) {
                            targetNode.insertBefore(processedNode, targetNode.firstChild);
                        } else {
                            targetNode.appendChild(processedNode);
                        }
                        containerRef.current.push(processedNode);
                    });
                };

                // Helper to perform the injection
                const runInjection = () => {
                    if (!mounted) return;

                    // Inject Head Scripts (without 'seo.' prefix)
                    if (settings['head_scripts']) {
                        injectHtml(settings['head_scripts'], document.head, false);
                    }

                    // Inject Body Scripts
                    if (settings['body_scripts']) {
                        injectHtml(settings['body_scripts'], document.body, true);
                    }

                    // Inject Footer Scripts
                    if (settings['footer_scripts']) {
                        injectHtml(settings['footer_scripts'], document.body, false);
                    }

                    // Inject Organization Schema
                    if (settings['organization_schema']) {
                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        const schemaData = settings['organization_schema'];
                        // Stringify if it's an object, otherwise use as is
                        script.textContent = typeof schemaData === 'string' ? schemaData : JSON.stringify(schemaData);
                        document.head.appendChild(script);
                        containerRef.current.push(script);
                    }
                };

                // Use requestIdleCallback to defer script injection
                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(runInjection, { timeout: 2000 });
                } else {
                    setTimeout(runInjection, 1000);
                }

            } catch (e) {
                console.error('Failed to load site settings:', e);
            }
        };

        fetchSettings();

        return () => {
            mounted = false;
            if (containerRef.current && containerRef.current.length) {
                containerRef.current.forEach(el => {
                    try { el.parentNode?.removeChild(el); } catch { }
                });
            }
        };
    }, []);
}

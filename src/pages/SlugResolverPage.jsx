import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiClient';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import AttractionDetails from './AttractionDetails';
import BlogDetails from './Blog';
import CMSPage from './CMSPage';
import ComboDetails from './ComboDetails';
import NotFound from './NotFound';

/**
 * SlugResolverPage
 * Fetches the type of a slug from the backend and renders the appropriate component.
 * This handles the ambiguity of root-level slugs (Attractions, Blogs, Pages, Combos).
 */
export default function SlugResolverPage() {
    const { slug } = useParams();
    const [state, setState] = React.useState({ status: 'loading', type: null, error: null });

    React.useEffect(() => {
        if (!slug) return;
        const ac = new AbortController();

        (async () => {
            setState({ status: 'loading', type: null, error: null });
            try {
                // We use the new resolution endpoint
                const res = await api.get(`/api/resolve-slug/${slug}`, { signal: ac.signal, quiet404: true });
                setState({ status: 'succeeded', type: res.type, error: null });
            } catch (err) {
                if (err?.status === 404) {
                    setState({ status: 'succeeded', type: 'not_found', error: null });
                } else {
                    setState({ status: 'failed', type: null, error: err?.message || 'Failed to resolve slug' });
                }
            }
        })();

        return () => ac.abort();
    }, [slug]);

    if (state.status === 'loading') return <Loader />;
    if (state.status === 'failed') return <ErrorState message={state.error} />;

    switch (state.type) {
        case 'attraction':
            return <AttractionDetails />;
        case 'blog':
            return <BlogDetails />;
        case 'page':
            return <CMSPage />;
        case 'combo':
            return <ComboDetails />;
        case 'not_found':
        default:
            return <NotFound />;
    }
}

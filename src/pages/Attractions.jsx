import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import AttractionCard from '../components/cards/AttractionCard';
import ComboCard from '../components/cards/ComboCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { safeKey } from '../utils/keys';

export default function Attractions() {
  const dispatch = useDispatch();
  const { items: attractions, status: aStatus, error: aError } = useSelector((s) => s.attractions);
  const { items: combos, status: cStatus } = useSelector((s) => s.combos);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (aStatus === 'idle') dispatch(fetchAttractions({ active: true, page: 1, limit: 30 }));
    if (cStatus === 'idle') dispatch(fetchCombos({ active: true, page: 1, limit: 12 }));
  }, [aStatus, cStatus, dispatch]);

  const list = React.useMemo(() => {
    if (!q) return attractions;
    const s = q.toLowerCase();
    return attractions.filter((x) =>
      String(x.name || x.title || '').toLowerCase().includes(s)
    );
  }, [attractions, q]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-12 mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">
            All Attractions
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover our complete collection of thrilling winter experiences and unforgettable adventures.
          </p>
          <div className="w-20 h-1.5 bg-[#003de6] mx-auto mt-6 mb-8 rounded-full" />
        </div>

        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              Showing {list.length} attraction{list.length !== 1 ? 's' : ''}
            </div>
            <div className="w-full sm:w-96">
              <input
                className="w-full rounded-full border border-gray-300 px-6 py-3 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                placeholder="Search attractions..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {aStatus === 'loading' && !attractions.length ? <Loader /> : null}
        {aStatus === 'failed' ? <ErrorState message={aError?.message || 'Failed to load attractions'} /> : null}

        {/* Attractions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {list.map((item, idx) => (
            <AttractionCard key={safeKey('attr', item, idx)} item={item} />
          ))}
        </div>

        {/* Combo Deals Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">
              Combo Deals
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Save more with our curated combo packages for multiple experiences.
            </p>
            <div className="w-20 h-1.5 bg-[#003de6] mx-auto mt-6 rounded-full" />
          </div>

          {cStatus === 'loading' && !combos.length ? <Loader /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((c, idx) => (
              <ComboCard key={safeKey('combo', c, idx)} item={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
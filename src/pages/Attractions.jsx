import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import AttractionCard from '../components/cards/AttractionCard';
import ComboCard from '../components/cards/ComboCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { safeKey } from '../utils/keys';
import usePageSeo from '../hooks/usePageSeo';

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
    let result = attractions;
    if (q) {
      const s = q.toLowerCase();
      result = attractions.filter((x) =>
        String(x.name || x.title || '').toLowerCase().includes(s)
      );
    }

    // Sort to prioritize Snow Park and Mad Lab first
    return [...result].sort((a, b) => {
      const titleA = (a?.title || a?.name || '').toLowerCase();
      const titleB = (b?.title || b?.name || '').toLowerCase();

      const isSnowParkA = titleA.includes('snow park');
      const isSnowParkB = titleB.includes('snow park');
      const isMadLabA = titleA.includes('mad lab') || titleA.includes('madlab');
      const isMadLabB = titleB.includes('mad lab') || titleB.includes('madlab');
      const isEyelusionA = titleA.includes('eyelusion');
      const isEyelusionB = titleB.includes('eyelusion');

      // Rank 1: Snow Park
      if (isSnowParkA && !isSnowParkB) return -1;
      if (!isSnowParkA && isSnowParkB) return 1;

      // Rank 2: Mad Lab
      if (isMadLabA && !isMadLabB) return -1;
      if (!isMadLabA && isMadLabB) return 1;

      // Rank 3: Eyelusion
      if (isEyelusionA && !isEyelusionB) return -1;
      if (!isEyelusionA && isEyelusionB) return 1;

      // Otherwise maintain ID order
      const idA = a?.attraction_id ?? a?.id ?? 0;
      const idB = b?.attraction_id ?? b?.id ?? 0;
      return idA - idB;
    });
  }, [attractions, q]);
  
  const sortedCombos = React.useMemo(() => {
    return [...combos].sort((a, b) => {
      const titleA = (a.title || a.name || a.combo_name || '').toLowerCase();
      const titleB = (b.title || b.name || b.combo_name || '').toLowerCase();
      
      const isAllAccessA = titleA.includes('all-access pass');
      const isAllAccessB = titleB.includes('all-access pass');
      const isSpecificComboA = titleA.includes('snowcity-madlabs-eyelusion') || (titleA.includes('snow city') && titleA.includes('madlabs') && titleA.includes('eyelusion'));
      const isSpecificComboB = titleB.includes('snowcity-madlabs-eyelusion') || (titleB.includes('snow city') && titleB.includes('madlabs') && titleB.includes('eyelusion'));

      if (isAllAccessA && !isAllAccessB) return -1;
      if (!isAllAccessA && isAllAccessB) return 1;

      if (isSpecificComboA && !isSpecificComboB) return -1;
      if (!isSpecificComboA && isSpecificComboB) return 1;

      return 0;
    });
  }, [combos]);

  usePageSeo({
    slug: 'attractions',
    title: 'All Attractions | Snow City Bangalore',
    description: 'Discover the coolest attractions at Snow City Bangalore. From indoor snow parks to thrilling games and family fun.',
    canonical: window.location.href,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] to-white pt-10 pb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-12 mb-8">
          <h1 className="text-4xl md:text-4xl font-black text-slate-900 tracking-tight  leading-none mb-4">
            All Attractions
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover our complete collection of thrilling winter experiences and unforgettable adventures.
          </p>
          <div className="w-20 h-1.5 bg-[#003de6] mx-auto mt-3 mb-2 rounded-xl" />
        </div>

        {aStatus === 'loading' && !attractions.length ? <Loader /> : null}
        {aStatus === 'failed' ? <ErrorState message={aError?.message || 'Failed to load attractions'} /> : null}

        {/* Attractions Grid */}
        <div className="flex flex-col gap-8  mb-10">
          {list.length > 0 && (
            <div className="w-full">
              <AttractionCard
                item={list[0]}
                featured={true}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.slice(1).map((item, idx) => (
              <AttractionCard key={safeKey('attr', item, idx)} item={item} />
            ))}
          </div>
        </div>

        {/* Combo Deals Section */}
        <div className="mt-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-4">
              Combo Deals
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Save more with our curated combo packages for multiple experiences.
            </p>
            <div className="w-20 h-1.5 bg-[#003de6] mx-auto mt-6 rounded-xl" />
          </div>

          {cStatus === 'loading' && !combos.length ? <Loader /> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCombos.map((c, idx) => (
              <ComboCard key={safeKey('combo', c, idx)} item={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
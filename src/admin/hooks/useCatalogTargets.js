import React from 'react';
import adminApi from '../services/adminApi';
import A from '../services/adminEndpoints';

const parseList = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.list)) return res.list;
  return [];
};

const normalizeTargets = (items = [], type = 'attraction') => {
  const fallbackLabel = type === 'combo' ? 'Combo' : 'Attraction';
  return items.map((item, index) => {
    const rawId = item.id ?? item.attraction_id ?? item.combo_id ?? item.target_id ?? (index + 1);
    const numericId = Number(rawId);
    const id = Number.isNaN(numericId) ? index + 1 : numericId;
    const display_label = item.display_label || item.title || item.name || item.combo_name || `${fallbackLabel} #${id}`;
    return {
      ...item,
      id,
      display_label,
    };
  });
};

export default function useCatalogTargets(options = {}) {
  const { includeInactive = false } = options;
  const [state, setState] = React.useState({
    status: 'idle',
    error: null,
    attractions: [],
    combos: [],
  });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = includeInactive ? undefined : { params: { active: true } };
      const [attRes, comboRes] = await Promise.all([
        adminApi.get(A.attractions(), params),
        adminApi.get(A.combos(), params),
      ]);
      const attractions = normalizeTargets(parseList(attRes), 'attraction');
      const combos = normalizeTargets(parseList(comboRes), 'combo');
      setState({ status: 'succeeded', error: null, attractions, combos });
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [includeInactive]);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}

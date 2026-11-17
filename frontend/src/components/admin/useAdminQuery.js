import { useCallback, useEffect, useState } from 'react';
import { dataCache } from '../../services/dataCache';

// Ignore responses from an older filter, page, or unmounted view.
export default function useAdminQuery(fetcher, refreshKey = 0, explicitKey = null) {
  const [revision, setRevision] = useState(0);
  const cacheKey = explicitKey || fetcher?.name || 'overview';
  const cachedData = dataCache.getAdminData(cacheKey);

  const [result, setResult] = useState(() => (cachedData ? {
    fetcher,
    refreshKey,
    revision: 0,
    data: cachedData,
    updatedAt: new Date(),
    error: null,
  } : null));

  useEffect(() => {
    let current = true;
    Promise.resolve().then(fetcher).then(
      data => {
        if (current) {
          setResult({ fetcher, refreshKey, revision, data, updatedAt: new Date(), error: null });
          if (data) dataCache.setAdminData(cacheKey, data);
        }
      },
      error => {
        if (current) {
          setResult(prev => ({
            fetcher,
            refreshKey,
            revision,
            data: prev?.data || cachedData || null,
            updatedAt: prev?.updatedAt || null,
            error
          }));
        }
      },
    );
    return () => { current = false; };
  }, [fetcher, refreshKey, revision, cacheKey]);

  const reload = useCallback(() => setRevision(value => value + 1), []);
  const ready = (result?.fetcher === fetcher && result?.refreshKey === refreshKey && result?.revision === revision) || !!cachedData;
  return {
    data: result?.data || cachedData || null,
    error: result?.error || null,
    loading: !ready && !result?.data && !cachedData,
    updatedAt: result?.updatedAt || null,
    reload,
  };
}

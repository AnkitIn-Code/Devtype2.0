import { useCallback, useEffect, useState } from 'react';

// Ignore responses from an older filter, page, or unmounted view.
export default function useAdminQuery(fetcher, refreshKey = 0) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let current = true;
    Promise.resolve().then(fetcher).then(
      data => { if (current) setResult({ fetcher, refreshKey, revision, data, updatedAt: new Date(), error: null }); },
      error => { if (current) setResult({ fetcher, refreshKey, revision, data: null, updatedAt: null, error }); },
    );
    return () => { current = false; };
  }, [fetcher, refreshKey, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const ready = result?.fetcher === fetcher && result?.refreshKey === refreshKey && result?.revision === revision;
  return {
    data: ready ? result.data : null,
    error: ready ? result.error : null,
    loading: !ready,
    updatedAt: ready ? result.updatedAt : null,
    reload,
  };
}

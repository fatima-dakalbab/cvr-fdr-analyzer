import { useEffect, useMemo, useState } from 'react';
import { fetchCases } from '../api/cases';

const getComparableDate = (caseItem) => {
  if (!caseItem) {
    return 0;
  }

  const { updatedAt, createdAt, lastUpdated, date } = caseItem;
  const candidates = [updatedAt, createdAt, lastUpdated, date];

  for (const value of candidates) {
    if (!value) {
      continue;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  return 0;
};

const sortCasesByRecency = (list) =>
  [...list].sort((a, b) => getComparableDate(b) - getComparableDate(a));

export default function useRecentCases(count = 3) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCases();
        if (!isMounted) {
          return;
        }

        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load recent cases');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentCases = useMemo(() => sortCasesByRecency(cases).slice(0, count), [cases, count]);

  return {
    cases,
    recentCases,
    loading,
    error,
    refresh: async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchCases();
        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Unable to load recent cases');
        throw err;
      } finally {
        setLoading(false);
      }
    },
  };
}

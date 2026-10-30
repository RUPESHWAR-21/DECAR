import { useEffect, useState } from 'react';
import { getLive } from '../api';

const POLL_MS = 1000;
const SAVE_EVERY = 10; // store one reading in Supabase every 10 polls
const SERIES_LEN = 90;

// Polls the stateless live endpoint once a second for the given session.
// `series` holds recent problem probabilities and restarts with each session.
export function useLiveFeed(session) {
  const [data, setData] = useState(null);
  const [series, setSeries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let timer = null;
    let tick = 0;

    const poll = async () => {
      const save = tick % SAVE_EVERY === SAVE_EVERY - 1;
      tick += 1;
      try {
        const next = await getLive(session, save);
        if (!active) return;
        setData(next);
        setSeries((s) => (tick === 1 ? [next.probability] : [...s.slice(-(SERIES_LEN - 1)), next.probability]));
        setIsConnected(true);
      } catch {
        if (active) setIsConnected(false);
      }
      if (active) timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session]);

  return { data, series, isConnected };
}

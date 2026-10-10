import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSpineClient, type SpineClient, type SpineMode, type SpineSnapshot } from './client';

/**
 * One spine connection per surface.
 *
 * `mode` is 'local' until the service answers, so a statically hosted surface is
 * never blocked waiting for it. Components read `mode` and say which they are in
 * — a surface must never imply shared state it does not have.
 */

interface SpineContextValue {
  mode: SpineMode;
  online: boolean;
  rev: number;
  lastEventAt: string | null;
  client: SpineClient;
  /** Attach a listener; returns an unsubscribe function. */
  onSnapshot: (fn: (s: SpineSnapshot) => void) => () => void;
  onEvent: (fn: (e: any) => void) => () => void;
}

const SpineContext = createContext<SpineContextValue | null>(null);

export const SpineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => createSpineClient(), []);
  const [mode, setMode] = useState<SpineMode>('probing');
  const [rev, setRev] = useState(0);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  const snapshotListeners = useRef(new Set<(s: SpineSnapshot) => void>());
  const eventListeners = useRef(new Set<(e: any) => void>());

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const health = await client.health();
      if (cancelled) return;

      if (!health?.ok) {
        setMode('local');
        return;
      }

      setMode('shared');
      setRev(health.rev);

      // Prime the listeners with the current world.
      try {
        const snap = await client.snapshot();
        if (!cancelled) setRev(snap.rev);
        if (!cancelled) snapshotListeners.current.forEach(fn => fn(snap));
      } catch {
        /* the stream will bring us up to date */
      }

      unsubscribe = client.subscribe(
        event => {
          setLastEventAt(event.at);
          eventListeners.current.forEach(fn => fn(event));
          // A unit change alters the snapshot; refetch so every surface agrees.
          client
            .snapshot()
            .then(s => {
              setRev(s.rev);
              snapshotListeners.current.forEach(fn => fn(s));
            })
            .catch(() => {
              /* a failed refetch is recoverable on the next event */
            });
        },
        snap => {
          setRev(snap.rev);
          snapshotListeners.current.forEach(fn => fn(snap));
        }
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [client]);

  const value: SpineContextValue = {
    mode,
    online: mode === 'shared',
    rev,
    lastEventAt,
    client,
    onSnapshot: fn => {
      snapshotListeners.current.add(fn);
      return () => snapshotListeners.current.delete(fn);
    },
    onEvent: fn => {
      eventListeners.current.add(fn);
      return () => eventListeners.current.delete(fn);
    }
  };

  return <SpineContext.Provider value={value}>{children}</SpineContext.Provider>;
};

export const useSpine = (): SpineContextValue => {
  const ctx = useContext(SpineContext);
  if (!ctx) throw new Error('useSpine must be used within a SpineProvider');
  return ctx;
};

/**
 * A visible statement of which mode the surface is in. A console that shares
 * state with the others must say so; one running on bundled sample data must
 * say that instead.
 */
export const SpineStatus: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { mode, rev, lastEventAt } = useSpine();

  const copy =
    mode === 'shared'
      ? { dot: '#3fbf7f', label: 'Shared state · live', title: `Connected to the shared service. Revision ${rev}.${lastEventAt ? ` Last change ${new Date(lastEventAt).toLocaleTimeString()}.` : ''}` }
      : mode === 'local'
      ? { dot: '#a96b00', label: 'Local sample data', title: 'The shared service is not reachable, so this surface is showing its bundled sample data. Changes here are not visible to other surfaces.' }
      : { dot: '#8a9099', label: 'Connecting…', title: 'Looking for the shared service.' };

  return (
    <span
      title={copy.title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, ...style }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: copy.dot, flexShrink: 0 }} />
      {copy.label}
    </span>
  );
};

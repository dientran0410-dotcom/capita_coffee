import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { RouteLoadingOverlay } from '@/components/common/RouteLoadingOverlay';

// Slightly longer by default so the “pouring” animation is visible on navigation.
export function RouteChangeLoader({ durationMs = 800 }: { durationMs?: number }) {
  const location = useLocation();
  const [show, setShow] = useState(false);
  const prevKeyRef = useRef(location.key);

  useEffect(() => {
    if (prevKeyRef.current === location.key) return;

    prevKeyRef.current = location.key;
    setShow(true);

    const t = setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(t);
  }, [location.key, durationMs]);

  return show ? <RouteLoadingOverlay /> : null;
}

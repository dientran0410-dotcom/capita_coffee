import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for detecting when an element enters the viewport with enhanced animations
 * @param threshold - Percentage of element visible to trigger (0-1)
 * @param rootMargin - Margin around the root (e.g., "0px 0px -100px 0px")
 * @returns [ref, isVisible] - Ref to attach to element and visibility state
 */
export const useScrollReveal = (threshold = 0.1, rootMargin = '0px') => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, disconnect to avoid re-triggering
          observer.disconnect();
        }
      },
      { 
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return [ref, isVisible] as const;
};

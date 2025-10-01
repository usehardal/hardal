import { useEffect, useRef } from 'react';
import { useHardal } from './HardalProvider';

interface UseHardalTrackingOptions {
  eventName: string;
  data?: Record<string, any>;
  trackOnMount?: boolean;
  trackOnUnmount?: boolean;
  trackOnChange?: boolean;
  dependencies?: any[];
}

/**
 * Hook to track events with lifecycle control
 * 
 * @example
 * ```tsx
 * // Track on component mount
 * useHardalTracking({
 *   eventName: 'page_loaded',
 *   data: { page: 'home' },
 *   trackOnMount: true
 * });
 * 
 * // Track when dependencies change
 * useHardalTracking({
 *   eventName: 'filter_changed',
 *   data: { filter: selectedFilter },
 *   trackOnChange: true,
 *   dependencies: [selectedFilter]
 * });
 * ```
 */
export const useHardalTracking = ({
  eventName,
  data = {},
  trackOnMount = false,
  trackOnUnmount = false,
  trackOnChange = false,
  dependencies = [],
}: UseHardalTrackingOptions) => {
  const { track, isReady } = useHardal();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    // Track on mount
    if (trackOnMount && !isMounted.current) {
      track(eventName, data);
      isMounted.current = true;
      return;
    }

    // Track on change (after initial mount)
    if (trackOnChange && isMounted.current) {
      track(eventName, data);
    }

    // Mark as mounted after first render
    if (!isMounted.current) {
      isMounted.current = true;
    }

    // Track on unmount
    return () => {
      if (trackOnUnmount) {
        track(eventName, { ...data, unmounted: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, trackOnMount, trackOnUnmount, trackOnChange, ...dependencies]);
};

/**
 * Hook to track pageviews in Next.js or React Router
 * 
 * @example
 * ```tsx
 * // In your _app.tsx or layout
 * useHardalPageview();
 * ```
 */
export const useHardalPageview = () => {
  const { trackPageview, isReady } = useHardal();

  useEffect(() => {
    if (isReady) {
      trackPageview();
    }
  }, [isReady, trackPageview]);
};


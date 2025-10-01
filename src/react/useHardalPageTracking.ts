import { useEffect } from 'react';
import { useHardal } from './HardalProvider';

/**
 * Hook for automatic pageview tracking in Next.js App Router
 * 
 * Requires: next/navigation (Next.js 13+)
 * 
 * @example
 * ```tsx
 * // In your root layout or a client component
 * 'use client';
 * 
 * import { useHardalPageTracking } from 'hardal/react';
 * 
 * export function Analytics() {
 *   useHardalPageTracking();
 *   return null;
 * }
 * ```
 */
export function useHardalPageTracking() {
  const { trackPageview, isReady } = useHardal();

  useEffect(() => {
    // Dynamically import Next.js hooks
    let pathname: string | undefined;
    let searchParams: string | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { usePathname, useSearchParams } = require('next/navigation');
      pathname = usePathname();
      searchParams = useSearchParams()?.toString();
    } catch (e) {
      console.warn('[Hardal] next/navigation not found. Make sure you are using Next.js 13+ with App Router.');
      return;
    }

    if (isReady) {
      trackPageview();
    }
  }, [isReady, trackPageview]);
}


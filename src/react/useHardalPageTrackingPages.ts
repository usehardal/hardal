import { useEffect } from 'react';
import { useHardal } from './HardalProvider';

/**
 * Hook for automatic pageview tracking in Next.js Pages Router
 * 
 * Requires: next/router (Next.js Pages Router)
 * 
 * @example
 * ```tsx
 * // In your _app.tsx
 * import { useHardalPageTrackingPages } from 'hardal/react';
 * 
 * export default function App({ Component, pageProps }: AppProps) {
 *   useHardalPageTrackingPages();
 *   
 *   return <Component {...pageProps} />;
 * }
 * ```
 */
export function useHardalPageTrackingPages() {
  const { trackPageview, isReady } = useHardal();

  useEffect(() => {
    if (!isReady) return;

    let router: any;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useRouter } = require('next/router');
      router = useRouter();
    } catch (e) {
      console.warn('[Hardal] next/router not found. Make sure you are using Next.js Pages Router.');
      return;
    }

    // Track initial pageview
    trackPageview();

    // Track on route change
    const handleRouteChange = () => {
      trackPageview();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [isReady, trackPageview]);
}


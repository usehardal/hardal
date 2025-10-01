import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hardal from '../Hardal';
import { HardalConfig } from '../types';

interface HardalContextValue {
  hardal: Hardal | null;
  isReady: boolean;
  track: (eventName: string, data?: Record<string, any>) => Promise<any>;
  trackPageview: () => Promise<any>;
  distinct: (data: Record<string, any>) => Promise<any>;
}

const HardalContext = createContext<HardalContextValue | undefined>(undefined);

interface HardalProviderProps {
  config: HardalConfig;
  children: React.ReactNode;
  disabled?: boolean;
  autoPageTracking?: boolean; // Enable automatic pageview tracking for React/Next.js
}

export const HardalProvider: React.FC<HardalProviderProps> = ({
  config,
  children,
  disabled = false,
  autoPageTracking = false,
}) => {
  const [isReady, setIsReady] = useState(false);
  const hardalRef = useRef<Hardal | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once and in browser environment
    if (typeof window === 'undefined' || disabled || initializedRef.current || hardalRef.current) {
      return;
    }

    try {
      // For React apps, disable autoTrack to prevent conflicts
      const reactConfig = {
        ...config,
        autoTrack: false, // Always false for React - use hooks instead
      };
      
      hardalRef.current = new Hardal(reactConfig);
      setIsReady(true);
      initializedRef.current = true;
    } catch (error) {
      console.error('[Hardal] Failed to initialize:', error);
    }

    // Cleanup on unmount
    return () => {
      if (hardalRef.current) {
        hardalRef.current.destroy();
        hardalRef.current = null;
        setIsReady(false);
        initializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto page tracking for React/Next.js
  useEffect(() => {
    if (!autoPageTracking || !isReady || !hardalRef.current) {
      return;
    }

    let cleanup: (() => void) | undefined;

    // Try Next.js App Router first (next/navigation)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const navigation = require('next/navigation');
      const usePathname = navigation.usePathname;
      const useSearchParams = navigation.useSearchParams;
      
      // This is a hack to use hooks in useEffect
      // We'll track on URL changes via popstate instead
      const handleRouteChange = () => {
        hardalRef.current?.trackPageview();
      };

      // Track initial page
      hardalRef.current.trackPageview();

      // Listen for URL changes
      window.addEventListener('popstate', handleRouteChange);
      
      // Watch for pushState/replaceState (Next.js navigation)
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function (...args) {
        originalPushState.apply(window.history, args);
        handleRouteChange();
      };

      window.history.replaceState = function (...args) {
        originalReplaceState.apply(window.history, args);
        handleRouteChange();
      };

      cleanup = () => {
        window.removeEventListener('popstate', handleRouteChange);
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      };
    } catch (e) {
      // Try Next.js Pages Router (next/router)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const router = require('next/router').default;
        
        // Track initial page
        hardalRef.current.trackPageview();

        const handleRouteChange = () => {
          hardalRef.current?.trackPageview();
        };

        router.events?.on('routeChangeComplete', handleRouteChange);

        cleanup = () => {
          router.events?.off('routeChangeComplete', handleRouteChange);
        };
      } catch (routerError) {
        // Fallback: Generic React app (no Next.js)
        const handleRouteChange = () => {
          hardalRef.current?.trackPageview();
        };

        // Track initial page
        hardalRef.current.trackPageview();

        // Listen for URL changes
        window.addEventListener('popstate', handleRouteChange);
        
        cleanup = () => {
          window.removeEventListener('popstate', handleRouteChange);
        };
      }
    }

    return cleanup;
  }, [autoPageTracking, isReady]);

  const track = useCallback(async (eventName: string, data?: Record<string, any>) => {
    if (!hardalRef.current) {
      console.warn('[Hardal] Instance not ready');
      return;
    }
    return hardalRef.current.track(eventName, data);
  }, []);

  const trackPageview = useCallback(async () => {
    if (!hardalRef.current) {
      console.warn('[Hardal] Instance not ready');
      return;
    }
    return hardalRef.current.trackPageview();
  }, []);

  const distinct = useCallback(async (data: Record<string, any>) => {
    if (!hardalRef.current) {
      console.warn('[Hardal] Instance not ready');
      return;
    }
    return hardalRef.current.distinct(data);
  }, []);

  const value: HardalContextValue = useMemo(() => ({
    hardal: hardalRef.current,
    isReady,
    track,
    trackPageview,
    distinct,
  }), [isReady, track, trackPageview, distinct]);

  return <HardalContext.Provider value={value}>{children}</HardalContext.Provider>;
};

export const useHardal = (): HardalContextValue => {
  const context = useContext(HardalContext);
  if (context === undefined) {
    throw new Error('useHardal must be used within a HardalProvider');
  }
  return context;
};


import React, { ComponentType, useEffect } from 'react';
import { useHardal } from './HardalProvider';

interface WithHardalTrackingOptions {
  eventName: string;
  getData?: (props: any) => Record<string, any>;
  trackOnMount?: boolean;
  trackOnUnmount?: boolean;
}

/**
 * Higher-Order Component to add automatic tracking to any component
 * 
 * @example
 * ```tsx
 * const MyComponent = ({ title }: Props) => <div>{title}</div>;
 * 
 * export default withHardalTracking(MyComponent, {
 *   eventName: 'component_viewed',
 *   getData: (props) => ({ title: props.title }),
 *   trackOnMount: true
 * });
 * ```
 */
export const withHardalTracking = <P extends object>(
  Component: ComponentType<P>,
  options: WithHardalTrackingOptions
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { track, isReady } = useHardal();

    useEffect(() => {
      if (!isReady) return;

      const eventData = options.getData ? options.getData(props) : {};

      if (options.trackOnMount) {
        track(options.eventName, eventData);
      }

      return () => {
        if (options.trackOnUnmount) {
          track(options.eventName, { ...eventData, unmounted: true });
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withHardalTracking(${Component.displayName || Component.name})`;

  return WrappedComponent;
};


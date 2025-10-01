# Hardal React/Next.js Integration

Complete guide for using Hardal with React and Next.js applications.

## Installation

```bash
npm install hardal
# or
bun add hardal
```

## Quick Start

### Next.js App Router (app directory)

```tsx
// app/providers.tsx
'use client';

import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider
      config={{
        website: // your hardal signal ID,
        hostUrl: // your hardal signal domain,
        autoTrack: true,
      }}
    >
      {children}
    </HardalProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Next.js Pages Router (pages directory)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { HardalProvider } from 'hardal/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HardalProvider
      config={{
        website: // Your Hardal Signal ID,
        hostUrl: // Your Hardal Signal Domain,
        autoTrack: true,
      }}
    >
      <Component {...pageProps} />
    </HardalProvider>
  );
}
```

### React SPA (Vite, CRA, etc.)

```tsx
// src/App.tsx
import { HardalProvider } from 'hardal/react';

function App() {
  return (
    <HardalProvider
      config={{
        website: import.meta.env.VITE_HARDAL_WEBSITE_ID,
        hostUrl: import.meta.env.VITE_HARDAL_HOST,
        autoTrack: true,
      }}
    >
      <YourApp />
    </HardalProvider>
  );
}
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_HARDAL_WEBSITE_ID=your-website-id
NEXT_PUBLIC_HARDAL_HOST=https://your-hardal-host.com
```

## API Reference

### `useHardal()`

Hook to access Hardal instance and tracking methods.

```tsx
import { useHardal } from 'hardal/react';

function MyComponent() {
  const { track, trackPageview, distinct, isReady } = useHardal();

  const handleClick = () => {
    track('button_clicked', {
      location: 'hero',
      type: 'cta',
    });
  };

  return <button onClick={handleClick}>Track Event</button>;
}
```

**Returns:**
- `hardal`: Hardal instance
- `isReady`: Boolean indicating if Hardal is initialized
- `track`: Function to track events
- `trackPageview`: Function to track pageviews
- `distinct`: Function to identify users

### `useHardalTracking()`

Hook for automatic event tracking with lifecycle control.

```tsx
import { useHardalTracking } from 'hardal/react';

function ProductCard({ productId, name }) {
  // Track when component mounts
  useHardalTracking({
    eventName: 'product_viewed',
    data: { productId, name },
    trackOnMount: true,
  });

  return <div>{name}</div>;
}
```

**Options:**
- `eventName` (required): Event name
- `data`: Event data object
- `trackOnMount`: Track when component mounts
- `trackOnUnmount`: Track when component unmounts
- `trackOnChange`: Track when dependencies change
- `dependencies`: Array of dependencies to watch

### `useHardalPageview()`

Hook for automatic pageview tracking (useful for SPA routing).

```tsx
import { useHardalPageview } from 'hardal/react';

function App() {
  useHardalPageview(); // Tracks pageview on mount
  return <YourApp />;
}
```

### `withHardalTracking()`

Higher-Order Component for automatic tracking.

```tsx
import { withHardalTracking } from 'hardal/react';

function PricingCard({ plan, price }) {
  return (
    <div>
      <h3>{plan}</h3>
      <p>${price}/month</p>
    </div>
  );
}

export default withHardalTracking(PricingCard, {
  eventName: 'pricing_card_viewed',
  getData: (props) => ({ plan: props.plan, price: props.price }),
  trackOnMount: true,
});
```

## Usage Examples

### Track User Interactions

```tsx
'use client';

import { useHardal } from 'hardal/react';

export function Hero() {
  const { track } = useHardal();

  const handleSignUp = () => {
    track('signup_clicked', {
      location: 'hero',
      plan: 'free',
    });
  };

  return <button onClick={handleSignUp}>Sign Up</button>;
}
```

### Identify Users

```tsx
'use client';

import { useEffect } from 'react';
import { useHardal } from 'hardal/react';

export function Dashboard() {
  const { distinct } = useHardal();

  useEffect(() => {
    const user = getUserFromAuth(); // Your auth logic
    if (user) {
      distinct({
        userId: user.id,
        email: user.email,
        plan: user.plan,
      });
    }
  }, [distinct]);

  return <div>Dashboard</div>;
}
```

### Track Form Submissions

```tsx
'use client';

import { useHardal } from 'hardal/react';

export function NewsletterForm() {
  const { track, distinct } = useHardal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // Track the event
    await track('newsletter_subscribed', { email });

    // Identify the user
    await distinct({ email, source: 'newsletter' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

### Track Dynamic Filters

```tsx
'use client';

import { useState } from 'react';
import { useHardalTracking } from 'hardal/react';

export function ProductFilters() {
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('any');

  // Track when filters change
  useHardalTracking({
    eventName: 'filters_changed',
    data: { category, priceRange },
    trackOnChange: true,
    dependencies: [category, priceRange],
  });

  return (
    <div>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
        <option value="any">Any Price</option>
        <option value="0-50">$0 - $50</option>
        <option value="50-100">$50 - $100</option>
      </select>
    </div>
  );
}
```

### Track Route Changes (React Router)

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHardal } from 'hardal/react';

export function RouteTracker() {
  const location = useLocation();
  const { trackPageview } = useHardal();

  useEffect(() => {
    trackPageview();
  }, [location.pathname, trackPageview]);

  return null; // This component doesn't render anything
}

// Add to your App:
// <BrowserRouter>
//   <RouteTracker />
//   <Routes>...</Routes>
// </BrowserRouter>
```

### Custom Tracking Hook

```tsx
import { useCallback } from 'react';
import { useHardal } from 'hardal/react';

export function useEcommerceTracking() {
  const { track } = useHardal();

  const trackProductView = useCallback(
    (productId: string, name: string, price: number) => {
      return track('product_viewed', { productId, name, price });
    },
    [track]
  );

  const trackAddToCart = useCallback(
    (productId: string, quantity: number, price: number) => {
      return track('add_to_cart', { productId, quantity, price });
    },
    [track]
  );

  const trackPurchase = useCallback(
    (orderId: string, total: number, items: any[]) => {
      return track('purchase_completed', { orderId, total, items });
    },
    [track]
  );

  return {
    trackProductView,
    trackAddToCart,
    trackPurchase,
  };
}

// Usage:
// const { trackAddToCart } = useEcommerceTracking();
// trackAddToCart(product.id, 1, product.price);
```

### Click Tracking with Data Attributes

Hardal automatically tracks clicks on elements with `data-hardal-event` attributes:

```tsx
export function Hero() {
  return (
    <div>
      {/* Button tracking */}
      <button 
        data-hardal-event="cta_click" 
        data-hardal-event-location="hero"
        data-hardal-event-type="signup"
      >
        Get Started
      </button>

      {/* Link tracking */}
      <a 
        href="/pricing" 
        data-hardal-event="pricing_link" 
        data-hardal-event-source="hero"
      >
        View Pricing
      </a>
    </div>
  );
}
```

## Configuration Options

```tsx
<HardalProvider
  config={{
    website: 'your-website-id',           // Required: Your website ID
    hostUrl: 'https://your-host.com',     // Optional: Custom host URL
    autoTrack: true,                       // Optional: Auto-track pageviews (default: true)
    doNotTrack: false,                     // Optional: Respect DNT (default: false)
    excludeSearch: false,                  // Optional: Exclude query params (default: false)
    excludeHash: false,                    // Optional: Exclude hash (default: false)
    domains: ['example.com'],              // Optional: Only track specific domains
  }}
  disabled={process.env.NODE_ENV === 'development'} // Optional: Disable in dev
>
  {children}
</HardalProvider>
```

## TypeScript Support

All hooks and components are fully typed:

```tsx
import { useHardal } from 'hardal/react';
import type { HardalConfig } from 'hardal';

const config: HardalConfig = {
  website: 'my-site',
  autoTrack: true,
};

function MyComponent() {
  const { track, isReady } = useHardal();
  // All properly typed!
}
```

## Best Practices

1. **Initialize Once**: Wrap your app root with `HardalProvider` only once
2. **Environment Variables**: Use environment variables for config
3. **Disable in Development**: Set `disabled={true}` in development mode
4. **Track Meaningful Events**: Focus on user actions that matter
5. **Use Hooks**: Prefer `useHardal()` over accessing the global instance
6. **Cleanup**: The provider automatically handles cleanup on unmount

## Examples

Check the `examples/` directory for complete examples:
- `nextjs-app-router.tsx` - Next.js 13+ App Router
- `nextjs-pages-router.tsx` - Next.js Pages Router
- `react-spa.tsx` - React SPA with React Router

## License

MIT


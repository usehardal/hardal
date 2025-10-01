# Hardal Performance Tips & Best Practices

## The Freezing Issue (FIXED in v3.2.0)

### What Was Wrong

In versions prior to 3.2.0, the `HardalProvider` caused infinite re-renders due to:

1. **Context value recreation** - The value object was recreated on every render
2. **Function recreation** - All callback functions were recreated on every render
3. **Config object references** - Changing config caused re-initialization

### What We Fixed

✅ **Used `useMemo`** for context value stabilization  
✅ **Used `useCallback`** for stable function references  
✅ **Added initialization guard** (`initializedRef`) to prevent re-initialization  
✅ **Removed config from dependencies** - Only initializes once on mount  

## Best Practices for Usage

### ✅ DO: Wrap at the Root Level

```tsx
// app/layout.tsx (Next.js App Router)
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/providers.tsx
'use client';
import { HardalProvider } from 'hardal/react';

export function Providers({ children }) {
  return (
    <HardalProvider
      config={{
        website: 'your-website-id',
        autoTrack: true,
      }}
    >
      {children}
    </HardalProvider>
  );
}
```

### ✅ DO: Use Environment Variables

```tsx
// app/providers.tsx
'use client';
import { HardalProvider } from 'hardal/react';

export function Providers({ children }) {
  return (
    <HardalProvider
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
        autoTrack: true,
      }}
    >
      {children}
    </HardalProvider>
  );
}
```

### ✅ DO: Disable in Development (Optional)

```tsx
export function Providers({ children }) {
  return (
    <HardalProvider
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        autoTrack: true,
      }}
      disabled={process.env.NODE_ENV === 'development'} // Don't track in dev
    >
      {children}
    </HardalProvider>
  );
}
```

### ❌ DON'T: Create Config Object Inline Without Memoization

While this now works in v3.2.0+, it's still not ideal:

```tsx
// ⚠️ Works but not optimal
function MyApp() {
  return (
    <HardalProvider
      config={{
        website: 'id', // This object is recreated on every render
      }}
    >
      <App />
    </HardalProvider>
  );
}
```

Better approach:

```tsx
// ✅ Better - config is stable
const hardalConfig = {
  website: 'your-id',
  autoTrack: true,
};

function MyApp() {
  return (
    <HardalProvider config={hardalConfig}>
      <App />
    </HardalProvider>
  );
}
```

### ❌ DON'T: Nest Multiple Providers

```tsx
// ❌ BAD - Only one provider needed
<HardalProvider config={config1}>
  <HardalProvider config={config2}>
    <App />
  </HardalProvider>
</HardalProvider>
```

```tsx
// ✅ GOOD - Single provider at root
<HardalProvider config={config}>
  <App />
</HardalProvider>
```

## Using Hardal Hooks

### ✅ DO: Use `useCallback` for Event Handlers

```tsx
'use client';
import { useCallback } from 'react';
import { useHardal } from 'hardal/react';

export function MyButton() {
  const { track } = useHardal();

  // ✅ Stable function reference
  const handleClick = useCallback(() => {
    track('button_clicked', { location: 'hero' });
  }, [track]);

  return <button onClick={handleClick}>Click Me</button>;
}
```

### ✅ DO: Check `isReady` for Critical Operations

```tsx
'use client';
import { useHardal } from 'hardal/react';

export function CriticalComponent() {
  const { track, isReady } = useHardal();

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <button onClick={() => track('event')}>Track</button>;
}
```

### ✅ DO: Use `useHardalTracking` for Lifecycle Events

```tsx
'use client';
import { useHardalTracking } from 'hardal/react';

export function ProductCard({ productId }) {
  // ✅ Automatically tracks on mount
  useHardalTracking({
    eventName: 'product_viewed',
    data: { productId },
    trackOnMount: true,
  });

  return <div>Product {productId}</div>;
}
```

## Performance Optimization

### 1. Lazy Load Hardal Provider

```tsx
// app/providers.tsx
'use client';
import dynamic from 'next/dynamic';
import { type ReactNode } from 'react';

const HardalProvider = dynamic(
  () => import('hardal/react').then(mod => ({ default: mod.HardalProvider })),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HardalProvider config={{ website: 'your-id' }}>
      {children}
    </HardalProvider>
  );
}
```

### 2. Debounce Rapid Events

```tsx
import { useCallback } from 'react';
import { useHardal } from 'hardal/react';
import { debounce } from 'lodash'; // or your own debounce

export function SearchInput() {
  const { track } = useHardal();

  const trackSearch = useCallback(
    debounce((query: string) => {
      track('search_performed', { query });
    }, 500),
    [track]
  );

  return (
    <input
      onChange={(e) => trackSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 3. Batch Multiple Events

```tsx
import { useCallback } from 'react';
import { useHardal } from 'hardal/react';

export function CheckoutForm() {
  const { track } = useHardal();

  const handleSubmit = useCallback(async (data) => {
    // Track multiple related events together
    await track('checkout_started', {
      items: data.items,
      total: data.total,
    });
    
    // Process checkout...
    
    await track('checkout_completed', {
      orderId: result.orderId,
      total: data.total,
    });
  }, [track]);

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Troubleshooting

### App Still Freezing?

1. **Update to v3.2.0+**
   ```bash
   npm install hardal@latest
   ```

2. **Clear Next.js cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check for multiple providers**
   - Search your codebase for `<HardalProvider`
   - Ensure only ONE provider wraps your app

4. **Check React DevTools**
   - Open React DevTools → Profiler
   - Look for components re-rendering excessively
   - Check if Hardal-related components are highlighted

5. **Verify config is stable**
   ```tsx
   // ❌ BAD
   <HardalProvider config={{ website: id }} />
   
   // ✅ GOOD
   const config = useMemo(() => ({ website: id }), [id]);
   <HardalProvider config={config} />
   ```

### Memory Leaks?

Hardal automatically cleans up on unmount, but if you notice memory issues:

1. **Check browser console** for errors
2. **Verify cleanup** - The provider calls `destroy()` on unmount
3. **Don't create multiple instances** - Use the provider, not `new Hardal()`

## Version History

- **v3.2.0** - Fixed infinite re-render issue with memoization
- **v3.1.0** - Added React integration
- **v3.0.0** - Modern SDK rewrite

## Need Help?

If you're still experiencing issues:

1. Check [TYPESCRIPT_SETUP.md](./TYPESCRIPT_SETUP.md) for setup issues
2. Check [REACT.md](./REACT.md) for usage examples
3. Open an issue with:
   - Your Next.js/React version
   - Hardal version
   - Minimal reproduction code


# Next.js Setup Guide - Automatic Pageview Tracking

## The Problem

When using `autoTrack: true` in React/Next.js, it causes infinite loops because the SDK's vanilla JS auto-tracking conflicts with React's rendering cycle.

## The Solution

Use the `autoPageTracking` prop in `HardalProvider` for automatic route tracking!

---

## 🚀 Simple Setup (Recommended)

Works with **Next.js App Router**, **Pages Router**, and **React Router**!

```tsx
// app/providers.tsx (Next.js 13+ App Router)
'use client';

import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider 
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
      }}
      autoPageTracking={true}  // ✅ That's it! Tracks all route changes
    >
      {children}
    </HardalProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}  {/* No extra Analytics component needed! */}
        </Providers>
      </body>
    </html>
  );
}
```

---

## Alternative: Using Hooks (Advanced)

If you need more control, you can use hooks instead:

### Next.js App Router

```tsx
// app/analytics.tsx
'use client';

import { useHardalPageTracking } from 'hardal/react';

export function Analytics() {
  useHardalPageTracking();
  return null;
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { HardalProvider, useHardalPageTrackingPages } from 'hardal/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HardalProvider config={{ website: 'your-id', hostUrl: 'https://...' }}>
      <PageTracker />
      <Component {...pageProps} />
    </HardalProvider>
  );
}

function PageTracker() {
  useHardalPageTrackingPages();
  return null;
}
```

---

## Next.js Pages Router (pages directory)

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { HardalProvider } from 'hardal/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HardalProvider 
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
      }}
      autoPageTracking={true}  // ✅ Automatically tracks route changes
    >
      <Component {...pageProps} />
    </HardalProvider>
  );
}
```

---

## Manual Tracking (No Auto Pageviews)

If you want to track events manually without automatic pageviews:

```tsx
// app/providers.tsx
'use client';

import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider 
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
      }}
      // autoPageTracking={false} is the default
    >
      {children}
    </HardalProvider>
  );
}
```

Then track events manually:

```tsx
'use client';
import { useHardal } from 'hardal/react';

export function MyComponent() {
  const { track, trackPageview } = useHardal();
  
  return (
    <div>
      <button onClick={() => track('button_clicked', { action: 'cta' })}>
        Track Event
      </button>
      <button onClick={() => trackPageview()}>
        Track Pageview
      </button>
    </div>
  );
}
```

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_HARDAL_WEBSITE_ID=your-website-id
NEXT_PUBLIC_HARDAL_HOST=https://your-hardal-server.com
```

---

## Key Points

✅ **DO:**
- Use `HardalProvider` wrapper
- Use `useHardalPageTracking()` for App Router
- Use `useHardalPageTrackingPages()` for Pages Router
- Manual tracking with `useHardal()` hook

❌ **DON'T:**
- Use `autoTrack: true` in React apps (causes infinite loops)
- Create multiple `HardalProvider` instances
- Call `new Hardal()` directly in React components

---

## Why This Works

The vanilla JS `autoTrack` uses browser APIs (`history.pushState`, `popstate`) which conflict with React's rendering. Our React hooks use Next.js's router events instead, which:

1. ✅ Track only on actual route changes
2. ✅ Work with React's lifecycle
3. ✅ Clean up properly on unmount
4. ✅ No infinite loops or performance issues

---

## Troubleshooting

### "Infinite loop" or "Browser freezes"
- Remove `autoTrack: true` from config
- Use the hooks instead

### "Events not tracked"
- Check `hostUrl` is set correctly
- Open browser console for error messages
- Verify website ID is correct

### "Warning: next/navigation not found"
- Normal if using Pages Router (use `useHardalPageTrackingPages` instead)
- Or if using outside Next.js (use manual tracking)

---

## Need More Help?

- Check [REACT.md](./REACT.md) for full React documentation
- Check [PERFORMANCE_TIPS.md](./PERFORMANCE_TIPS.md) for optimization


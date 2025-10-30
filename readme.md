<p align="center">
  <a href="https://usehardal.com/?utm_source=github&utm_medium=github" target="_blank">
    <img src="https://res.cloudinary.com/hardal/image/upload/v1753259035/logo/new/png/bhwdwjtvhseq8jdhdkor.png" alt="Hardal" width="180" height="84">
  </a>
</p>

# Hardal

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![version](https://img.shields.io/badge/version-3.6.0-green.svg)](https://semver.org)

An official plugin to add the [Hardal](https://usehardal.com/) tracking to your web project with automatic pageview tracking, click tracking, and privacy-first analytics.

## What is Hardal?

[Hardal](https://usehardal.com/) is a privacy-first, server-side analytics platform that helps you:

- **Track user behavior** without compromising privacy
- **Automatic PII redaction** from URLs and data
- **First-party data collection** - you own your data
- **Event tracking** with custom properties
- **Automatic pageview tracking** for SPAs and Next.js
- **Works everywhere** - Vanilla JS, React, Next.js, Vue, etc.

## Installation

```bash
npm install hardal
# or
bun add hardal
# or
yarn add hardal
```

## Quick Start

### For React/Next.js Apps (Recommended)

```tsx
// app/providers.tsx
'use client';
import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider 
      config={{
        website: // Your Hardal Signal ID,
        hostUrl: // Your Hardal Signal Domain,
      }}
      autoPageTracking={true}  // ✅ Tracks all route changes
    >
      {children}
    </HardalProvider>
  );
}
```

### For Vanilla JavaScript / HTML

```html
<script
  defer
  src="<YOUR_SIGNAL_ENDPOINT>/hardal"
  data-website-id="<YOUR_SIGNAL_ID>"
  data-host-url="<YOUR_SIGNAL_ENDPOINT>"
  data-auto-track="true"
></script>
```

## Usage

### Example

```tsx
'use client';
import { useHardal } from 'hardal/react';

export function ContactForm() {
  const { track, distinct } = useHardal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    // Track the submission
    await track('form_submitted', {
      formType: 'contact',
      source: 'landing_page',
    });

    // Identify the user
    await distinct({
      email,
      source: 'contact_form',
    });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Configuration Options

### HardalProvider (React/Next.js)

```tsx
<HardalProvider
  config={{
    website: 'your-website-id',        // Required: Your Hardal website ID
    hostUrl: 'https://your-host.com',   // Required: Your Hardal server URL
  }}
  autoPageTracking={true}                // Optional: Auto-track route changes (default: false)
  disabled={process.env.NODE_ENV === 'development'} // Optional: Disable tracking
>
  {children}
</HardalProvider>
```

### Vanilla JS

```javascript
const hardal = new Hardal({
  website: 'your-website-id',
  hostUrl: 'https://your-hardal-server.com',
  autoTrack: true,              // Auto-track pageviews and history changes
});
```

### Identify Users

```typescript
// Identify a user with custom properties
hardal?.distinct({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium',
});
```

### Manual Pageview Tracking

```typescript
// Track a pageview manually
hardal?.trackPageview();

```

## API Reference

### `new Hardal(config)`

Creates a new Hardal instance.

**Config Options:**

- `website` (required): Your Hardal website ID
- `hostUrl` (optional): Custom host URL for your Hardal server
- `autoTrack` (optional): Auto-track pageviews (default: `true`)

### `track(eventName, data?)`

Track a custom event.

```typescript
hardal.track('event_name', { custom: 'data' });
```

### `distinct(data)`

Identify a user with custom properties.

```typescript
hardal.distinct({ userId: '123', email: 'user@example.com' });
```

### `trackPageview()`

Manually track a pageview.

```typescript
hardal.trackPageview();
```

### Common Patterns

### Track A/B Test Variants

```tsx
const { track, distinct } = useHardal();

// Track which variant user sees
track('experiment_viewed', {
  experimentId: 'pricing_test_v1',
  variant: 'B',
});

// Associate user with variant
distinct({
  experiments: {
    pricing_test_v1: 'B',
  },
});
```

### Track Error Events

```tsx
const { track } = useHardal();

try {
  await riskyOperation();
} catch (error) {
  track('error_occurred', {
    errorType: error.name,
    errorMessage: error.message,
    page: window.location.pathname,
  });
}
```

### Track Time on Page

```tsx
'use client';
import { useEffect } from 'react';
import { useHardal } from 'hardal/react';

export function TimeTracker() {
  const { track } = useHardal();

  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      track('time_on_page', {
        seconds: timeSpent,
        page: window.location.pathname,
      });
    };
  }, [track]);

  return null;
}
```

### Conditional Tracking (Development vs Production)

```tsx
<HardalProvider
  config={{
    website: // Your Hardal Signal ID,
    hostUrl: // Your Hardal Signal Domain,
  }}
  disabled={process.env.NODE_ENV === 'development'} // Don't track in dev
  autoPageTracking={true}
>
  {children}
</HardalProvider>
```

## Best Practices

✅ **DO:**

- Track meaningful user actions (clicks, form submissions, purchases)
- Use descriptive event names (`checkout_completed`, not `event1`)
- Include relevant context in event properties
- Identify users after authentication
- Test tracking in production-like environment

❌ **DON'T:**

- Track PII (emails, phone numbers) directly - use `distinct()` for user identification
- Send sensitive data in properties
- Track too many events (focus on business-critical actions)
- Use autoTrack in React apps - use `autoPageTracking` instead
- Create multiple Hardal instances

## Privacy & Security

Hardal automatically:

- 🔒 **Redacts PII** from URLs (emails, phone numbers, credit cards)
- 🛡️ **Respects Do Not Track** when configured
- 🔐 **Server-side processing** - no third-party trackers
- 📊 **First-party cookies** - you own your data
- ✅ **GDPR & CCPA friendly**

## Performance

- 📦 **Lightweight**: ~18KB minified
- ⚡ **Non-blocking**: Events sent asynchronously
- 🚀 **Queue system**: No lost events during initialization
- ⏱️ **5-second timeout**: Requests abort if server is slow
- 🧹 **Memory safe**: Proper cleanup on unmount

## Examples

Check the `examples/` directory for complete examples:

- **Next.js App Router** - `examples/nextjs-app-router.tsx`
- **Next.js Pages Router** - `examples/nextjs-pages-router.tsx`
- **React SPA** - `examples/react-spa.tsx`
- **HTML Data Attributes** - `examples/data-attributes.html`

## Troubleshooting

### "Browser freezes" or "Infinite loop"

- ❌ Don't use `autoTrack: true` in the config for React apps
- ✅ Use `autoPageTracking={true}` in `HardalProvider` instead

### "No valid hostUrl configured"

- Make sure you've set `hostUrl` in your config
- Verify it starts with `http://` or `https://`

### "Events not showing up"

- Check browser console for errors
- Verify `hostUrl` and `website` ID are correct
- Make sure your Hardal server is running
- Check network tab for failed requests

### TypeScript errors with `hardal/react`

- Run `npm install` to ensure dependencies are installed
- Restart TypeScript server in your IDE
- See [TYPESCRIPT_SETUP.md](./TYPESCRIPT_SETUP.md)

## Migration from v2.x

```tsx
// ❌ Old way (v2.x)
const hardal = new Hardal({
  endpoint: 'https://server.com',
  autoPageview: true,
});

// ✅ New way (v3.x)
<HardalProvider
  config={{
    website: 'your-id',
    hostUrl: 'https://server.com',
  }}
  autoPageTracking={true}
>
```

**Breaking changes:**

- `endpoint` → `hostUrl`
- `autoPageview` → removed (use `autoPageTracking` prop instead)
- `fetchFromGA4`, `fetchFromFBPixel`, `fetchFromRTB`, `fetchFromDataLayer` → removed
- React: Must use `HardalProvider` wrapper

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://usehardal.com/docs](https://usehardal.com/docs)
- Email: support@usehardal.com

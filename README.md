<p align="center">
  <a href="https://usehardal.com/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://imge.usehardal.com/cdn/logo/new/svg/hnav0hronsb1fttdnmph.svg?raw=1">
      <source media="(prefers-color-scheme: light)" srcset="https://imge.usehardal.com/cdn/logo/new/svg/ptlior6hfvknmblekenh.svg?raw=1">
      <img src="https://imge.usehardal.com/cdn/logo/new/svg/ptlior6hfvknmblekenh.svg?raw=1" alt="Hardal" width="180">
    </picture>
  </a>
</p>

# Hardal JavaScript SDK

Collect pageviews and custom events from a website and send them to your Hardal Signal endpoint. The SDK supports browser JavaScript, React, and Next.js, with automatic tracking, user identification, and manual event APIs.

[![Package license: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://www.npmjs.com/package/hardal) [![npm version](https://img.shields.io/npm/v/hardal.svg)](https://www.npmjs.com/package/hardal)

## Getting started

You need a browser application, a Hardal website ID, and a Signal endpoint that accepts `POST /push/hardal`. Set `website` and `hostUrl`, then follow the React/Next.js or HTML example below. React integrations run in the client and use the peer dependencies declared in [package.json](package.json).

## Features

[Hardal](https://usehardal.com/) is a privacy-first, server-side analytics platform that helps you:

- **Track user behavior** through your configured Hardal endpoint
- **Pattern-based PII redaction** from page and referrer URLs
- **First-party data collection** - you own your data
- **Event tracking** with custom properties
- **Automatic pageview tracking** for SPAs and Next.js
- **Browser integrations** - Vanilla JS, React, and Next.js examples

## Installation

```bash
npm install hardal
# or
bun add hardal
# or
yarn add hardal
```

## Quick start

### For React/Next.js Apps (Recommended)

```tsx
// app/providers.tsx
'use client';
import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider 
      config={{
        website: 'YOUR_WEBSITE_ID',
        hostUrl: 'https://YOUR_SIGNAL_ENDPOINT',
      }}
      autoPageTracking={true}  // Track supported route changes
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

## Configuration options

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
import Hardal from 'hardal';

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

### Manual pageview tracking

```typescript
// Track a pageview manually
hardal?.trackPageview();

```

## API reference

### `new Hardal(config)`

Creates a new Hardal instance.

**Config Options:**

- `website` (required): Your Hardal website ID
- `hostUrl`: Your Hardal Signal URL; a valid HTTP(S) URL is required to send events
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

## Common patterns

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
    website: 'YOUR_WEBSITE_ID',
    hostUrl: 'https://YOUR_SIGNAL_ENDPOINT',
  }}
  disabled={process.env.NODE_ENV === 'development'} // Don't track in dev
  autoPageTracking={true}
>
  {children}
</HardalProvider>
```

## Best practices

### Recommended

- Track meaningful user actions (clicks, form submissions, purchases)
- Use descriptive event names (`checkout_completed`, not `event1`)
- Include relevant context in event properties
- Identify users after authentication
- Test tracking in production-like environment

### Avoid

- Track PII (emails, phone numbers) directly - use `distinct()` for user identification
- Send sensitive data in properties
- Track too many events (focus on business-critical actions)
- Use autoTrack in React apps - use `autoPageTracking` instead
- Create multiple Hardal instances

## Privacy and data handling

- The SDK applies pattern-based redaction to page and referrer URLs for email addresses, selected phone-number formats, social security numbers, and credit-card-like numbers.
- `doNotTrack: true` enables Do Not Track handling; it is disabled by default.
- Events are sent to the configured `hostUrl`. Custom event properties and identification data require deliberate handling; URL redaction does not redact arbitrary event data.

Review [the URL redaction implementation](src/utils/privacy.ts) and your endpoint configuration when deciding which data to collect.

## Performance

- Events are sent asynchronously through an in-memory queue.
- Requests use a five-second abort timeout.
- The React provider cleans up its tracking instance on unmount.
- Bundle size depends on your build and imports; measure the artifact used by your application.

The in-memory queue does not provide durable delivery. Handle network failures according to your integration requirements.

## Examples

See [examples/](examples/) for complete examples:

- [Next.js App Router](examples/nextjs-app-router.tsx)
- [Next.js Pages Router](examples/nextjs-pages-router.tsx)
- [React SPA](examples/react-spa.tsx)
- [HTML data attributes](examples/data-attributes.html)

## Troubleshooting

### "Browser freezes" or "Infinite loop"

- Don't use `autoTrack: true` in the config for React apps
- Use `autoPageTracking={true}` in `HardalProvider` instead

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
- See the [Hardal documentation](https://docs.usehardal.com)

## Migration from v2.x

```tsx
// Old way (v2.x)
const hardal = new Hardal({
  endpoint: 'https://server.com',
  autoPageview: true,
});

// New way (v3.x)
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

The `hardal` package is published under the MIT License. See the [package on npm](https://www.npmjs.com/package/hardal) for current package metadata.

## Support

Maintained by [Hardal](https://github.com/usehardal).

- [Hardal documentation](https://docs.usehardal.com)
- [Report an issue](https://github.com/usehardal/hardal/issues)
- [Hardal website](https://usehardal.com)


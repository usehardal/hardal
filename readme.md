<p align="center">
  <a href="https://usehardal.com/?utm_source=github&utm_medium=github" target="_blank">
    <img src="https://res.cloudinary.com/hardal/image/upload/v1739542616/logo/t1gzroksoigjzjwe3vdq.svg" alt="Hardal" width="180" height="84">
  </a>
</p>

# Hardal

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![version](https://img.shields.io/badge/version-1.2.02-green.svg)](https://semver.org)

An official plugin to add the [Hardal](https://usehardal.com/) tracking server-side events to your React or Next.js project.

## What is Hardal?

[Hardal](https://usehardal.com/) is a server-side platform for connecting your first-party data from any source to any destination for websites and mobile apps.

## Installation

```bash
npm install hardal
```

## Usage

First, set up Hardal in your project:

```typescript
// lib/hardal.ts
import Hardal from '../hardal/index.js'

const isClient = typeof window !== 'undefined';
export const hardal = isClient
  ? new Hardal({
      endpoint: process.env.NEXT_PUBLIC_HARDAL_ENDPOINT,
      autoPageview: true,
      fetchFromDataLayer: true,
      // other options...
    })
  : null;

// Helper function to safely use hardal
export const track = (eventName: string, properties?: Record<string, any>) => {
  if (hardal) {
    hardal.track(eventName, properties);
  }
};

export default hardal;
```

Then use it in your components:

```jsx
"use client"
import { track } from '@/lib/hardal';

export const MyComponent = () => {
  const eventHandler = () => {
    track('button_click', {
      type: 'submit',
      page: '/checkout',
      package: 'premium',
      ...// any other properties
      
    });
  }

  return (
    <div>
      <button onClick={eventHandler}>Send Event</button>
    </div>
  )
}
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://docs.usehardal.com](https://usehardal.com)
- Email: support@usehardal.com


// ============================================
// Next.js App Router Example (app directory)
// ============================================

// app/providers.tsx
'use client';

import { HardalProvider } from 'hardal/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HardalProvider
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
        autoTrack: true,
        excludeSearch: false,
        excludeHash: false,
      }}
    >
      {children}
    </HardalProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';

import { useHardal } from 'hardal/react';

export default function HomePage() {
  const { track, isReady } = useHardal();

  const handleClick = () => {
    track('button_clicked', {
      location: 'home_page',
      button: 'cta',
    });
  };

  return (
    <div>
      <h1>Welcome to Hardal</h1>
      <button onClick={handleClick} disabled={!isReady}>
        Track Click Event
      </button>
    </div>
  );
}

// ============================================
// Component with automatic tracking
// ============================================

// components/TrackedComponent.tsx
'use client';

import { useHardalTracking } from 'hardal/react';

export function ProductCard({ productId, name }: { productId: string; name: string }) {
  // Automatically track when component mounts
  useHardalTracking({
    eventName: 'product_viewed',
    data: { productId, name },
    trackOnMount: true,
  });

  return (
    <div>
      <h2>{name}</h2>
      <p>Product ID: {productId}</p>
    </div>
  );
}

// ============================================
// Track with user identification
// ============================================

// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useHardal } from 'hardal/react';

export default function DashboardPage() {
  const { distinct, track } = useHardal();

  useEffect(() => {
    // Identify user after authentication
    const user = getUserFromAuth(); // Your auth logic
    if (user) {
      distinct({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        signupDate: user.createdAt,
      });
    }
  }, [distinct]);

  const handleUpgrade = () => {
    track('upgrade_clicked', {
      currentPlan: 'free',
      targetPlan: 'pro',
    });
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleUpgrade}>Upgrade to Pro</button>
    </div>
  );
}

function getUserFromAuth() {
  // Mock function - replace with your actual auth logic
  return {
    id: 'user-123',
    email: 'user@example.com',
    plan: 'free',
    createdAt: new Date(),
  };
}


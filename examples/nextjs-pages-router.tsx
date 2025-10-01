// ============================================
// Next.js Pages Router Example (pages directory)
// ============================================

// pages/_app.tsx
import type { AppProps } from 'next/app';
import { HardalProvider } from 'hardal/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HardalProvider
      config={{
        website: process.env.NEXT_PUBLIC_HARDAL_WEBSITE_ID!,
        hostUrl: process.env.NEXT_PUBLIC_HARDAL_HOST,
        autoTrack: true,
      }}
    >
      <Component {...pageProps} />
    </HardalProvider>
  );
}

// pages/index.tsx
import { useHardal, useHardalTracking } from 'hardal/react';

export default function HomePage() {
  const { track, distinct } = useHardal();

  // Track page view on mount
  useHardalTracking({
    eventName: 'home_page_viewed',
    trackOnMount: true,
  });

  const handleSubscribe = async (email: string) => {
    // Track event
    await track('newsletter_subscribed', { email });
    
    // Identify user
    await distinct({ email, source: 'newsletter' });
  };

  return (
    <div>
      <h1>Home Page</h1>
      <NewsletterForm onSubmit={handleSubscribe} />
    </div>
  );
}

function NewsletterForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <button type="submit">Subscribe</button>
    </form>
  );
}

// ============================================
// Track dynamic filters/search
// ============================================

// pages/products.tsx
import { useState } from 'react';
import { useHardalTracking } from 'hardal/react';

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Track when filter changes
  useHardalTracking({
    eventName: 'products_filtered',
    data: { filter, searchTerm },
    trackOnChange: true,
    dependencies: [filter, searchTerm],
  });

  return (
    <div>
      <h1>Products</h1>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
    </div>
  );
}

// ============================================
// Using HOC for automatic tracking
// ============================================

// components/PricingCard.tsx
import { withHardalTracking } from 'hardal/react';

interface PricingCardProps {
  plan: string;
  price: number;
  features: string[];
}

function PricingCard({ plan, price, features }: PricingCardProps) {
  return (
    <div>
      <h3>{plan}</h3>
      <p>${price}/month</p>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}

// Export with automatic tracking
export default withHardalTracking(PricingCard, {
  eventName: 'pricing_card_viewed',
  getData: (props) => ({
    plan: props.plan,
    price: props.price,
  }),
  trackOnMount: true,
});

// ============================================
// API route to track server-side events
// ============================================

// pages/api/track-conversion.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, plan, amount } = req.body;

  // Send server-side event to Hardal
  try {
    const response = await fetch(
      `${process.env.HARDAL_HOST}/push/hardal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'event',
          event_name: 'conversion_completed',
          payload: {
            website: process.env.HARDAL_WEBSITE_ID,
            distinct_id: userId,
            data: {
              plan,
              amount,
              timestamp: new Date().toISOString(),
            },
          },
        }),
      }
    );

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Failed to track conversion:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}


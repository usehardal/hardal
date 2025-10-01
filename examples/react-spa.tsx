// ============================================
// React SPA Example (with React Router)
// ============================================

// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HardalProvider } from 'hardal/react';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import ProductsPage from './pages/Products';

function App() {
  return (
    <HardalProvider
      config={{
        website: import.meta.env.VITE_HARDAL_WEBSITE_ID,
        hostUrl: import.meta.env.VITE_HARDAL_HOST,
        autoTrack: true,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
        </Routes>
      </BrowserRouter>
    </HardalProvider>
  );
}

export default App;

// ============================================
// Track route changes
// ============================================

// src/components/RouteTracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useHardal } from 'hardal/react';

export function RouteTracker() {
  const location = useLocation();
  const { trackPageview } = useHardal();

  useEffect(() => {
    trackPageview();
  }, [location.pathname, trackPageview]);

  return null;
}

// Update App.tsx to include RouteTracker
// <BrowserRouter>
//   <RouteTracker />
//   <Routes>...</Routes>
// </BrowserRouter>

// ============================================
// Custom tracking hook
// ============================================

// src/hooks/useProductTracking.ts
import { useCallback } from 'react';
import { useHardal } from 'hardal/react';

export function useProductTracking() {
  const { track } = useHardal();

  const trackProductView = useCallback(
    (productId: string, name: string, price: number) => {
      return track('product_viewed', {
        productId,
        name,
        price,
        category: 'electronics',
      });
    },
    [track]
  );

  const trackAddToCart = useCallback(
    (productId: string, quantity: number) => {
      return track('add_to_cart', {
        productId,
        quantity,
      });
    },
    [track]
  );

  const trackPurchase = useCallback(
    (orderId: string, total: number, items: any[]) => {
      return track('purchase_completed', {
        orderId,
        total,
        itemCount: items.length,
        items,
      });
    },
    [track]
  );

  return {
    trackProductView,
    trackAddToCart,
    trackPurchase,
  };
}

// Usage in component:
// const { trackProductView, trackAddToCart } = useProductTracking();

// ============================================
// Error boundary with tracking
// ============================================

// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error with Hardal
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

// Wrap with tracking:
// import { useHardal } from 'hardal/react';
//
// function App() {
//   const { track } = useHardal();
//   
//   return (
//     <ErrorBoundary
//       onError={(error, errorInfo) => {
//         track('error_occurred', {
//           error: error.message,
//           stack: error.stack,
//           componentStack: errorInfo.componentStack,
//         });
//       }}
//     >
//       <YourApp />
//     </ErrorBoundary>
//   );
// }

// ============================================
// Form tracking
// ============================================

// src/components/TrackedForm.tsx
import { useState, FormEvent } from 'react';
import { useHardal } from 'hardal/react';

export function ContactForm() {
  const { track } = useHardal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Track form submission
    await track('form_submitted', {
      formType: 'contact',
      hasMessage: formData.message.length > 0,
    });

    // Submit form...
  };

  const handleFieldBlur = (fieldName: string) => {
    // Track field completion
    track('form_field_completed', {
      formType: 'contact',
      fieldName,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        onBlur={() => handleFieldBlur('name')}
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        onBlur={() => handleFieldBlur('email')}
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        onBlur={() => handleFieldBlur('message')}
      />
      <button type="submit">Send</button>
    </form>
  );
}


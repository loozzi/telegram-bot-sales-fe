import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Layout
import { ShopLayout } from './components/layout/ShopLayout';

// Pages
import { LoginPage, RegisterPage } from './pages/auth';

import { ShopsPage } from './pages/shops';
import { BankPage } from './pages/bank';

// Shop Detail Tabs
import { ShopOverview } from './pages/shop-detail/tabs/ShopOverview';
import { ShopCategories } from './pages/shop-detail/tabs/ShopCategories';
import { ShopResources } from './pages/shop-detail/tabs/ShopResources';
import { ShopSettings } from './pages/shop-detail/tabs/ShopSettings';
import { ShopOrders } from './pages/shop-detail/tabs/ShopOrders';


import { ResourceDetailPage } from './pages/resource-detail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/shops" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/shops"
            element={
              <ProtectedRoute>
                <ShopsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bank"
            element={
              <ProtectedRoute>
                <BankPage />
              </ProtectedRoute>
            }
          />

          {/* Shop specific routes */}
          <Route
            path="/shops/:shopId"
            element={
              <ProtectedRoute>
                <ShopLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ShopOverview />} />
            <Route path="categories" element={<ShopCategories />} />
            <Route path="resources" element={<ShopResources />} />
            <Route path="settings" element={<ShopSettings />} />
            <Route path="settings" element={<ShopSettings />} />
            <Route path="orders" element={<ShopOrders />} />
            <Route path="bank" element={<BankPage />} />

            {/* Detail pages for items within a shop */}
            <Route path="resources/:resourceId" element={<ResourceDetailPage />} />
          </Route>

          {/* Redirect root to shops */}
          <Route path="/" element={<Navigate to="/shops" replace />} />
          <Route path="*" element={<Navigate to="/shops" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;

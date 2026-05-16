import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/Login';
import OnboardingPage from '@/pages/Onboarding';
import DashboardPage from '@/pages/Dashboard';
import CatalogPage from '@/pages/Catalog';
import QuoteBuilderPage from '@/pages/QuoteBuilder';
import QuotesPage from '@/pages/Quotes';
import BookingsPage from '@/pages/Bookings';
import InvoicesPage from '@/pages/Invoices';
import AssistantPage from '@/pages/Assistant';
import SurveyPage from '@/pages/Survey';
import SettingsPage from '@/pages/Settings';
import OperatorAssignments from '@/pages/OperatorAssignments';

function RootRedirect() {
  const { profile } = useAuthStore();
  if (profile?.role === 'operator') return <Navigate to="/my-assignments" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Protected */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/quote-builder" element={<QuoteBuilderPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/my-assignments" element={<OperatorAssignments />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

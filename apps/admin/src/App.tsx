import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/Login';
import FleetListPage from '@/pages/fleet/FleetList';
import BookingsCalendarPage from '@/pages/bookings/BookingsCalendar';
import BookingsKanbanPage from '@/pages/bookings/BookingsKanban';
import ClientsListPage from '@/pages/crm/ClientsList';
import ClientDetailPage from '@/pages/crm/ClientDetail';
import LeadPipelinePage from '@/pages/crm/LeadPipeline';
import QuotesListPage from '@/pages/quotes/QuotesList';
import QuoteEditorPage from '@/pages/quotes/QuoteEditor';
import OperatorRosterPage from '@/pages/hr/OperatorRoster';
import OperatorSchedulePage from '@/pages/hr/OperatorSchedule';
import MaintenancePage from '@/pages/maintenance/MaintenanceTracker';
import AnalyticsPage from '@/pages/analytics/AnalyticsDashboard';
import CmsPage from '@/pages/cms/ContentCMS';
import SettingsPage from '@/pages/settings/AdminSettings';
import OverviewPage from '@/pages/Overview';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />

        {/* Fleet */}
        <Route path="/fleet" element={<FleetListPage />} />

        {/* Bookings */}
        <Route path="/bookings/calendar" element={<BookingsCalendarPage />} />
        <Route path="/bookings/kanban" element={<BookingsKanbanPage />} />

        {/* CRM */}
        <Route path="/crm/clients" element={<ClientsListPage />} />
        <Route path="/crm/clients/:id" element={<ClientDetailPage />} />
        <Route path="/crm/leads" element={<LeadPipelinePage />} />

        {/* Quotes */}
        <Route path="/quotes" element={<QuotesListPage />} />
        <Route path="/quotes/:id" element={<QuoteEditorPage />} />

        {/* HR */}
        <Route path="/hr/roster" element={<OperatorRosterPage />} />
        <Route path="/hr/schedule" element={<OperatorSchedulePage />} />

        {/* Maintenance */}
        <Route path="/maintenance" element={<MaintenancePage />} />

        {/* Analytics */}
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* CMS */}
        <Route path="/cms" element={<CmsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

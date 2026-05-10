import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import {
  LayoutDashboard,
  Truck,
  CalendarDays,
  KanbanSquare,
  Users,
  GitBranch,
  FileText,
  HardHat,
  Wrench,
  BarChart3,
  Newspaper,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  end?: boolean;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [{ label: 'Dashboard', to: '/overview', icon: LayoutDashboard, end: true }],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Fleet', to: '/fleet', icon: Truck },
      { label: 'Calendar', to: '/bookings/calendar', icon: CalendarDays },
      { label: 'Dispatch', to: '/bookings/kanban', icon: KanbanSquare },
    ],
  },
  {
    group: 'Sales',
    items: [
      { label: 'Clients', to: '/crm/clients', icon: Building2 },
      { label: 'Leads', to: '/crm/leads', icon: GitBranch },
      { label: 'Quotes', to: '/quotes', icon: FileText },
    ],
  },
  {
    group: 'People',
    items: [
      { label: 'Operators', to: '/hr/roster', icon: HardHat },
      { label: 'Schedule', to: '/hr/schedule', icon: CalendarDays },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Maintenance', to: '/maintenance', icon: Wrench },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Content', to: '/cms', icon: Newspaper },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'bg-sidebar fixed left-0 top-0 z-40 flex h-screen select-none flex-col transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-14'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gold">
          <span className="text-xs font-black text-navy">N</span>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-sm font-bold leading-tight text-white">
              Nazrah Al Alam
            </p>
            <p className="whitespace-nowrap text-[10px] text-white/40">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((group) => (
          <div key={group.group} className="mb-3">
            {sidebarOpen && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-gold/20 font-medium text-gold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-white/10 text-white/40 transition-colors hover:text-white"
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}

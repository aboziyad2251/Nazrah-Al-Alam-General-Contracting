import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import {
  LayoutDashboard,
  Truck,
  CalendarDays,
  KanbanSquare,
  Building2,
  GitBranch,
  FileText,
  HardHat,
  Wrench,
  BarChart3,
  Newspaper,
  Settings,
} from 'lucide-react';

const COMMANDS = [
  { group: 'Navigation', label: 'Dashboard', to: '/overview', icon: LayoutDashboard },
  { group: 'Navigation', label: 'Fleet', to: '/fleet', icon: Truck },
  { group: 'Navigation', label: 'Bookings Calendar', to: '/bookings/calendar', icon: CalendarDays },
  { group: 'Navigation', label: 'Dispatch Kanban', to: '/bookings/kanban', icon: KanbanSquare },
  { group: 'Navigation', label: 'Clients', to: '/crm/clients', icon: Building2 },
  { group: 'Navigation', label: 'Leads Pipeline', to: '/crm/leads', icon: GitBranch },
  { group: 'Navigation', label: 'Quotes', to: '/quotes', icon: FileText },
  { group: 'Navigation', label: 'New Quote', to: '/quotes/new', icon: FileText },
  { group: 'Navigation', label: 'Operators', to: '/hr/roster', icon: HardHat },
  { group: 'Navigation', label: 'Operator Schedule', to: '/hr/schedule', icon: CalendarDays },
  { group: 'Navigation', label: 'Maintenance', to: '/maintenance', icon: Wrench },
  { group: 'Navigation', label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { group: 'Navigation', label: 'Content CMS', to: '/cms', icon: Newspaper },
  { group: 'Navigation', label: 'Settings', to: '/settings', icon: Settings },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const navigate = useNavigate();

  if (!commandPaletteOpen) return null;

  const go = (to: string) => {
    navigate(to);
    setCommandPaletteOpen(false);
  };

  const groups = [...new Set(COMMANDS.map((c) => c.group))];

  return (
    <div
      data-cmdk-dialog=""
      onClick={(e) => {
        if (e.target === e.currentTarget) setCommandPaletteOpen(false);
      }}
    >
      <Command data-cmdk-root="" loop>
        <Command.Input data-cmdk-input="" placeholder="Search pages, actions…" autoFocus />
        <Command.List data-cmdk-list="">
          <Command.Empty data-cmdk-empty="">No results found.</Command.Empty>
          {groups.map((group) => (
            <Command.Group key={group} heading={group} data-cmdk-group="">
              {COMMANDS.filter((c) => c.group === group).map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item key={cmd.to} data-cmdk-item="" onSelect={() => go(cmd.to)}>
                    <Icon size={14} />
                    {cmd.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}

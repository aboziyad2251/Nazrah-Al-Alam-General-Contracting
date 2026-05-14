import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/cn';

export function AdminLayout() {
  const { sidebarOpen, setCommandPaletteOpen } = useUiStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <Sidebar />
      <div className={cn('transition-all duration-200', sidebarOpen ? 'ml-56' : 'ml-14')}>
        <TopBar />
        <main className="min-h-[calc(100vh-3.5rem)] p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

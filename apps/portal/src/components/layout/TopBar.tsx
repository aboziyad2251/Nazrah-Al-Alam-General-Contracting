import { Bell, Search, Globe } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export function TopBar() {
  const { locale, setLocale } = useUIStore();
  const { profile } = useAuthStore();
  const initials = (profile?.full_name ?? 'U').charAt(0).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-stone bg-white px-6">
      {/* Search */}
      <div className="max-w-md flex-1">
        <div className="flex items-center gap-2 rounded-lg bg-cloud px-3 py-2">
          <Search size={15} className="text-ink-500" />
          <input
            className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
            placeholder={locale === 'ar' ? 'بحث...' : 'Search…'}
          />
        </div>
      </div>

      <div className="ms-auto flex items-center gap-3">
        {/* Locale toggle */}
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-ink-500 transition-colors hover:bg-cloud hover:text-navy"
        >
          <Globe size={15} />
          {locale === 'en' ? 'العربية' : 'English'}
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-cloud">
          <Bell size={18} className="text-ink-500" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}

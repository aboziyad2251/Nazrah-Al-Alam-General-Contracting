import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  FileText,
  CalendarCheck,
  Receipt,
  Bot,
  Camera,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم' },
  { to: '/catalog', icon: Package, en: 'Catalog', ar: 'المعدات' },
  { to: '/quote-builder', icon: ShoppingCart, en: 'Quote Builder', ar: 'طلب عرض' },
  { to: '/quotes', icon: FileText, en: 'Quotes', ar: 'العروض' },
  { to: '/bookings', icon: CalendarCheck, en: 'Bookings', ar: 'الحجوزات' },
  { to: '/invoices', icon: Receipt, en: 'Invoices', ar: 'الفواتير' },
  { to: '/assistant', icon: Bot, en: 'AI Assistant', ar: 'المساعد' },
  { to: '/survey', icon: Camera, en: 'Site Survey', ar: 'مسح الموقع' },
  { to: '/settings', icon: Settings, en: 'Settings', ar: 'الإعدادات' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, locale } = useUIStore();
  const { signOut } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const navigate = useNavigate();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex h-screen shrink-0 flex-col overflow-hidden bg-navy text-white"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold">
          <span className="text-sm font-bold text-navy">NA</span>
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <p className="text-sm font-semibold leading-tight">Nazrah Al Alam</p>
              <p className="text-xs text-white/50">Client Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {nav.map(({ to, icon: Icon, en, ar }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-gold font-semibold text-navy'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <div className="relative shrink-0">
              <Icon size={18} />
              {to === '/quote-builder' && cartItems.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-navy">
                  {cartItems.length}
                </span>
              )}
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {locale === 'ar' ? ar : en}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => {
            signOut();
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle btn */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-navy shadow-md"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  );
}

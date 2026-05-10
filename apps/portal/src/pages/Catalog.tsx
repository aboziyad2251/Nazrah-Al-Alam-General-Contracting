import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader, Skeleton, EmptyState, StatusBadge } from '@/components/ui';
import { ShoppingCart, X, SlidersHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

interface Equipment {
  id: number;
  model_name: string;
  brand: string;
  status: string;
  daily_rate_sar: number | null;
  specs: Record<string, unknown>;
  equipment_categories: { name_en: string; name_ar: string; slug: string } | null;
}

export default function CatalogPage() {
  const { locale } = useUIStore();
  const { addItem, items } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [drawerItem, setDrawerItem] = useState<Equipment | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_categories')
        .select('slug,name_en,name_ar')
        .order('sort_order');
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', selectedCategory, selectedBrand],
    queryFn: async () => {
      let q = supabase
        .from('equipment')
        .select('*,equipment_categories(name_en,name_ar,slug)')
        .eq('status', 'available');
      if (selectedCategory !== 'all') q = q.eq('equipment_categories.slug', selectedCategory);
      if (selectedBrand !== 'all') q = q.eq('brand', selectedBrand);
      const { data } = await q.order('model_name');
      return (data ?? []) as Equipment[];
    },
  });

  const brands = [...new Set(equipment?.map((e) => e.brand).filter(Boolean))];
  const inCart = (id: number) => items.some((i) => i.equipment_id === id);

  const handleAdd = (item: Equipment) => {
    addItem({
      equipment_id: item.id,
      model_name: item.model_name,
      brand: item.brand ?? '',
      category: item.equipment_categories?.name_en ?? '',
      daily_rate_sar: item.daily_rate_sar ?? 0,
      qty: 1,
      days: 1,
      with_operator: false,
    });
    toast.success(`${item.model_name} added to quote`);
    setDrawerItem(null);
  };

  return (
    <div>
      <PageHeader
        title={locale === 'ar' ? 'كتالوج المعدات' : 'Equipment Catalog'}
        subtitle={
          locale === 'ar'
            ? 'تصفح معداتنا المتاحة وأضفها إلى عرض أسعارك.'
            : 'Browse available equipment and add to your quote.'
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#E8EAED] bg-white px-3 py-2">
          <SlidersHorizontal size={14} className="text-[#5A6573]" />
          <span className="text-xs font-medium text-[#5A6573]">Filter:</span>
        </div>

        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="cursor-pointer rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-sm text-[#0F1117] outline-none"
        >
          <option value="all">All Categories</option>
          {categories?.map((c) => (
            <option key={c.slug} value={c.slug}>
              {locale === 'ar' ? c.name_ar : c.name_en}
            </option>
          ))}
        </select>

        {/* Brand */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="cursor-pointer rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-sm text-[#0F1117] outline-none"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : !equipment?.length ? (
        <EmptyState title="No equipment found" subtitle="Try adjusting your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E8EAED] bg-white transition-shadow hover:shadow-md"
              onClick={() => setDrawerItem(item)}
            >
              {/* Image placeholder */}
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#0E1F3A] to-[#1a3560]">
                <span className="text-4xl">🏗️</span>
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight text-[#0F1117]">
                    {item.model_name}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mb-3 text-xs text-[#5A6573]">
                  {item.brand} ·{' '}
                  {locale === 'ar'
                    ? item.equipment_categories?.name_ar
                    : item.equipment_categories?.name_en}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#0E1F3A]">
                    {item.daily_rate_sar ? `SAR ${item.daily_rate_sar}/day` : 'On Request'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd(item);
                    }}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all',
                      inCart(item.id)
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-[#0E1F3A] text-white hover:bg-[#E8B339] hover:text-[#0E1F3A]'
                    )}
                  >
                    {inCart(item.id) ? <Check size={14} /> : <ShoppingCart size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerItem(null)} />
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F1117]">{drawerItem.model_name}</h2>
              <button
                onClick={() => setDrawerItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9DCE0] hover:bg-[#E8EAED]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mb-5 flex h-48 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E1F3A] to-[#1a3560]">
              <span className="text-6xl">🏗️</span>
            </div>
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#5A6573]">Brand</span>
                <span className="font-medium">{drawerItem.brand}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5A6573]">Category</span>
                <span className="font-medium">{drawerItem.equipment_categories?.name_en}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5A6573]">Status</span>
                <StatusBadge status={drawerItem.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5A6573]">Daily Rate</span>
                <span className="font-bold text-[#0E1F3A]">
                  {drawerItem.daily_rate_sar ? `SAR ${drawerItem.daily_rate_sar}` : 'On Request'}
                </span>
              </div>
            </div>
            {/* Specs */}
            {Object.keys(drawerItem.specs ?? {}).length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-[#0F1117]">Specifications</h3>
                <div className="space-y-2 rounded-xl bg-[#D9DCE0] p-4">
                  {Object.entries(drawerItem.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="capitalize text-[#5A6573]">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => handleAdd(drawerItem)}
              disabled={inCart(drawerItem.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-60"
            >
              {inCart(drawerItem.id) ? (
                <>
                  <Check size={16} /> Added to Quote
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Quote
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

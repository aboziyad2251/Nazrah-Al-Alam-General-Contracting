import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { exportToCSV } from '@/lib/exportUtils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, StatusBadge, Btn, EmptyState } from '@/components/ui/index';
import EquipmentForm from './EquipmentForm';
import MaintenanceLog from './MaintenanceLog';
import { Plus, Wrench, Download, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Equipment {
  id: number;
  model_name: string;
  brand: string;
  year: number;
  daily_rate_sar: number;
  status: string;
  location: string;
  image_urls: string[];
  category: { name_en: string };
}

const STATUS_OPTIONS = ['', 'available', 'rented', 'maintenance', 'retired'];

export default function FleetListPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [maintItem, setMaintItem] = useState<Equipment | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['fleet', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('equipment')
        .select('*, category:equipment_categories(name_en)')
        .order('model_name');
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data } = await q;
      return (data ?? []) as Equipment[];
    },
  });

  const retire = async (eq: Equipment) => {
    if (!confirm(`Retire ${eq.model_name}?`)) return;
    await supabase.from('equipment').update({ status: 'retired' }).eq('id', eq.id);
    await logAudit('retire', 'equipment', eq.id, { status: 'retired' });
    toast.success('Equipment retired');
    qc.invalidateQueries({ queryKey: ['fleet'] });
  };

  const openEdit = (eq: Equipment) => {
    setEditItem(eq);
    setFormOpen(true);
  };

  const columns: Column<Equipment>[] = [
    {
      key: 'image',
      header: '',
      width: 'w-14',
      render: (eq) =>
        eq.image_urls?.[0] ? (
          <img src={eq.image_urls[0]} className="h-10 w-10 rounded-lg object-cover" alt="" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone">
            <Truck size={16} className="text-ink-500" />
          </div>
        ),
    },
    {
      key: 'model_name',
      header: 'Model',
      sortable: true,
      render: (eq) => <span className="font-medium text-ink-900">{eq.model_name}</span>,
    },
    { key: 'brand', header: 'Brand', sortable: true, render: (eq) => eq.brand },
    { key: 'category', header: 'Category', render: (eq) => eq.category?.name_en ?? '—' },
    { key: 'status', header: 'Status', render: (eq) => <StatusBadge status={eq.status} /> },
    {
      key: 'daily_rate_sar',
      header: 'Daily Rate',
      sortable: true,
      render: (eq) => `SAR ${eq.daily_rate_sar?.toLocaleString()}`,
    },
    { key: 'location', header: 'Location', render: (eq) => eq.location ?? '—' },
    {
      key: 'actions',
      header: '',
      render: (eq) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(eq)}>
            Edit
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => setMaintItem(eq)}>
            <Wrench size={12} />
          </Btn>
          {eq.status !== 'retired' && (
            <Btn size="sm" variant="danger" onClick={() => retire(eq)}>
              Retire
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        subtitle={`${data.length} machines`}
        action={
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              size="sm"
              onClick={() =>
                exportToCSV(
                  data.map((e) => ({
                    id: e.id,
                    model: e.model_name,
                    brand: e.brand,
                    status: e.status,
                    daily_rate: e.daily_rate_sar,
                  })),
                  'fleet'
                )
              }
            >
              <Download size={14} /> Export
            </Btn>
            <Btn
              onClick={() => {
                setEditItem(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} /> Add Equipment
            </Btn>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-ink-700 rounded-lg border border-cloud px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyField="id"
        selectable
        loading={isLoading}
        emptyState={
          <EmptyState
            icon={<Truck size={40} />}
            title="No equipment found"
            subtitle="Add your first machine to get started"
          />
        }
        bulkActions={(rows) => (
          <Btn
            size="sm"
            variant="secondary"
            onClick={() =>
              exportToCSV(
                rows.map((e) => ({ id: e.id, model: e.model_name, status: e.status })),
                'fleet-export'
              )
            }
          >
            <Download size={12} /> Export selected
          </Btn>
        )}
      />

      <EquipmentForm
        open={formOpen}
        item={editItem}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        onSaved={() => {
          setFormOpen(false);
          setEditItem(null);
          qc.invalidateQueries({ queryKey: ['fleet'] });
        }}
      />

      {maintItem && <MaintenanceLog equipment={maintItem} onClose={() => setMaintItem(null)} />}
    </div>
  );
}

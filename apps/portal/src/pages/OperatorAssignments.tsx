import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { format } from 'date-fns';
import { MapPin, Truck, Calendar, CheckCircle2, Clock, Package } from 'lucide-react';

type Assignment = {
  id: number;
  booking_id: number;
  dispatched_at: string | null;
  returned_at: string | null;
  equipment: { model_name: string; category: string } | null;
  bookings: {
    id: number;
    status: string;
    delivery_address: string | null;
    delivery_date: string | null;
    return_date: string | null;
    clients: {
      profile: { company: string | null; full_name: string | null; phone: string | null } | null;
    } | null;
  } | null;
};

function statusBadge(a: Assignment) {
  if (a.returned_at) return { label: 'Returned', labelAr: 'مُرتجع', cls: 'bg-stone text-ink-500' };
  if (a.dispatched_at)
    return { label: 'On Site', labelAr: 'في الموقع', cls: 'bg-blue-50 text-blue-700' };
  return { label: 'Pending', labelAr: 'قيد الانتظار', cls: 'bg-yellow-50 text-yellow-700' };
}

export default function OperatorAssignments() {
  const { profile } = useAuthStore();
  const { locale } = useUIStore();
  const qc = useQueryClient();
  const ar = locale === 'ar';

  const [filter, setFilter] = useState<'active' | 'done'>('active');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['operator-assignments', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_assignments')
        .select(
          `id, booking_id, dispatched_at, returned_at,
           equipment:equipment_id(model_name, category),
           bookings(id, status, delivery_address, delivery_date, return_date,
             clients(profile:profiles(company, full_name, phone)))`
        )
        .eq('operator_id', profile!.id)
        .order('dispatched_at', { ascending: false, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
  });

  const markDispatched = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('booking_assignments')
        .update({ dispatched_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operator-assignments'] }),
  });

  const markReturned = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('booking_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operator-assignments'] }),
  });

  const visible = assignments.filter((a) =>
    filter === 'active' ? !a.returned_at : !!a.returned_at
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">{ar ? 'مهامي' : 'My Assignments'}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {ar ? 'المعدات المخصصة لك' : 'Equipment assigned to you'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {(['active', 'done'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-navy text-white'
                : 'text-ink-600 border border-stone bg-white hover:bg-cloud'
            }`}
          >
            {f === 'active' ? (ar ? 'النشطة' : 'Active') : ar ? 'المكتملة' : 'Completed'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-ink-300 mb-3" />
          <p className="text-ink-600 font-medium">{ar ? 'لا توجد مهام' : 'No assignments'}</p>
          <p className="text-ink-400 mt-1 text-sm">
            {filter === 'active'
              ? ar
                ? 'ستظهر المهام النشطة هنا'
                : 'Active assignments will appear here'
              : ar
                ? 'المهام المكتملة ستظهر هنا'
                : 'Completed assignments will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => {
            const badge = statusBadge(a);
            const client = a.bookings?.clients?.profile;
            const clientName = client?.company ?? client?.full_name ?? '—';

            return (
              <div key={a.id} className="rounded-2xl border border-stone bg-white p-5 shadow-sm">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{a.equipment?.model_name ?? '—'}</p>
                    <p className="text-xs capitalize text-ink-500">{a.equipment?.category ?? ''}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                    {ar ? badge.labelAr : badge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="mb-4 space-y-1.5">
                  <div className="text-ink-600 flex items-center gap-2 text-sm">
                    <Truck size={14} className="text-ink-400 shrink-0" />
                    <span>{ar ? 'العميل:' : 'Client:'}</span>
                    <span className="font-medium text-ink-900">{clientName}</span>
                    {client?.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="ml-auto text-xs text-navy underline"
                      >
                        {client.phone}
                      </a>
                    )}
                  </div>

                  {a.bookings?.delivery_address && (
                    <div className="text-ink-600 flex items-start gap-2 text-sm">
                      <MapPin size={14} className="text-ink-400 mt-0.5 shrink-0" />
                      <span>{a.bookings.delivery_address}</span>
                    </div>
                  )}

                  <div className="text-ink-600 flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-ink-400 shrink-0" />
                    <span>
                      {a.bookings?.delivery_date
                        ? format(new Date(a.bookings.delivery_date), 'MMM d, yyyy')
                        : '—'}
                      {a.bookings?.return_date
                        ? ` → ${format(new Date(a.bookings.return_date), 'MMM d, yyyy')}`
                        : ''}
                    </span>
                  </div>

                  {a.dispatched_at && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Clock size={12} />
                      {ar ? 'تم الإرسال:' : 'Dispatched:'}{' '}
                      {format(new Date(a.dispatched_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                  {a.returned_at && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle2 size={12} />
                      {ar ? 'تم الإرجاع:' : 'Returned:'}{' '}
                      {format(new Date(a.returned_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!a.returned_at && (
                  <div className="flex gap-2">
                    {!a.dispatched_at && (
                      <button
                        type="button"
                        onClick={() => markDispatched.mutate(a.id)}
                        disabled={markDispatched.isPending}
                        className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {ar ? 'تأكيد الإرسال' : 'Mark Dispatched'}
                      </button>
                    )}
                    {a.dispatched_at && (
                      <button
                        type="button"
                        onClick={() => markReturned.mutate(a.id)}
                        disabled={markReturned.isPending}
                        className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {ar ? 'تأكيد الإرجاع' : 'Mark Returned'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

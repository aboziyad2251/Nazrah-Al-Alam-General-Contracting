import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { PageHeader, Card, StatusBadge, Modal, Btn } from '@/components/ui/index';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { User } from 'lucide-react';

const COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 border-blue-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-purple-100 border-purple-300' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 border-green-300' },
];

function BookingCard({ booking }: { booking: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: booking.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-stone bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold text-ink-500">#{booking.id}</span>
      </div>
      <p className="mb-1 text-sm font-semibold text-ink-900">
        {booking.client?.profile?.company ?? booking.client?.profile?.full_name ?? 'Unknown'}
      </p>
      <p className="mb-2 text-xs text-ink-500">
        {booking.delivery_date ? format(new Date(booking.delivery_date), 'MMM d') : '—'}
        {' → '}
        {booking.return_date ? format(new Date(booking.return_date), 'MMM d') : '—'}
      </p>
      {booking.booking_assignments?.map((a: any, i: number) => (
        <div key={i} className="text-ink-600 mt-1 flex items-center gap-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-navy/40" />
          {a.equipment?.model_name}
          {a.operator && <span className="text-ink-400">· {a.operator.full_name}</span>}
        </div>
      ))}
    </div>
  );
}

export default function BookingsKanbanPage() {
  const qc = useQueryClient();
  const [assignBooking, setAssignBooking] = useState<any | null>(null);
  const [operatorId, setOperatorId] = useState('');

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-kanban'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          `
          id, status, delivery_date, return_date,
          client:clients(profile:profiles(full_name, company)),
          booking_assignments(
            id,
            equipment:equipment(model_name),
            operator:profiles(full_name)
          )
        `
        )
        .not('status', 'eq', 'cancelled');
      return data ?? [];
    },
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('operators')
        .select('id, profile:profiles(full_name)')
        .eq('available', true);
      return data ?? [];
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const bookingId = Number(active.id);
    const newStatus = String(over.id);
    const booking = bookings.find((b: any) => b.id === bookingId);
    if (!booking || booking.status === newStatus) return;

    await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    await logAudit('status_change', 'booking', bookingId, { from: booking.status, to: newStatus });
    toast.success(`Booking #${bookingId} → ${newStatus.replace('_', ' ')}`);
    qc.invalidateQueries({ queryKey: ['bookings-kanban'] });
  };

  const assignOperator = async () => {
    if (!operatorId || !assignBooking) return;
    const { data: assignments } = await supabase
      .from('booking_assignments')
      .select('id')
      .eq('booking_id', assignBooking.id)
      .limit(1);
    if (assignments?.[0]) {
      await supabase
        .from('booking_assignments')
        .update({ operator_id: operatorId })
        .eq('id', assignments[0].id);
      await logAudit('assign_operator', 'booking_assignment', assignments[0].id, {
        operator_id: operatorId,
      });
    }
    toast.success('Operator assigned');
    setAssignBooking(null);
    setOperatorId('');
    qc.invalidateQueries({ queryKey: ['bookings-kanban'] });
  };

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = bookings.filter((b: any) => b.status === col.key);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <div>
      <PageHeader title="Dispatch Board" subtitle="Drag cards to update booking status" />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="w-72 flex-shrink-0">
              <div
                className={`rounded-xl border ${col.color} mb-3 flex items-center justify-between p-3`}
              >
                <span className="text-sm font-semibold text-ink-900">{col.label}</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
                  {grouped[col.key]?.length ?? 0}
                </span>
              </div>

              <SortableContext
                id={col.key}
                items={grouped[col.key]?.map((b: any) => b.id) ?? []}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-24 space-y-2 rounded-xl bg-stone/20 p-2">
                  {grouped[col.key]?.map((booking: any) => (
                    <div key={booking.id}>
                      <BookingCard booking={booking} />
                      <button
                        onClick={() => setAssignBooking(booking)}
                        className="mt-1 flex w-full items-center justify-center gap-1 py-0.5 text-[11px] text-ink-500 hover:text-navy"
                      >
                        <User size={10} /> Assign operator
                      </button>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Assign operator modal */}
      <Modal open={!!assignBooking} onClose={() => setAssignBooking(null)} title="Assign Operator">
        <p className="mb-3 text-sm text-ink-500">Booking #{assignBooking?.id}</p>
        <select
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">Select operator…</option>
          {operators.map((op: any) => (
            <option key={op.id} value={op.id}>
              {op.profile?.full_name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setAssignBooking(null)}>
            Cancel
          </Btn>
          <Btn onClick={assignOperator} disabled={!operatorId} className="flex-1">
            Assign
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

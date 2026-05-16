import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { PageHeader, Card, Modal, Btn } from '@/components/ui/index';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { User, Plus, Trash2, CheckCircle2, Clock, Truck } from 'lucide-react';

const COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 border-blue-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-purple-100 border-purple-300' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 border-green-300' },
];

function BookingCard({ booking, onAssign }: { booking: any; onAssign: (b: any) => void }) {
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
        {booking.booking_assignments?.length > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-600">
            <Truck size={9} /> {booking.booking_assignments.length}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm font-semibold text-ink-900">
        {booking.client?.profile?.company ?? booking.client?.profile?.full_name ?? 'Unknown'}
      </p>
      <p className="mb-2 text-xs text-ink-500">
        {booking.delivery_date ? format(new Date(booking.delivery_date), 'MMM d') : '—'}
        {' → '}
        {booking.return_date ? format(new Date(booking.return_date), 'MMM d') : '—'}
      </p>
      {booking.booking_assignments?.slice(0, 2).map((a: any, i: number) => (
        <div key={i} className="text-ink-600 mt-1 flex items-center gap-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-navy/40" />
          <span className="truncate">{a.equipment?.model_name}</span>
          {a.operator && <span className="text-ink-400 truncate">· {a.operator.full_name}</span>}
        </div>
      ))}
      {booking.booking_assignments?.length > 2 && (
        <p className="text-ink-400 mt-0.5 text-[10px]">
          +{booking.booking_assignments.length - 2} more
        </p>
      )}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onAssign(booking);
        }}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded py-0.5 text-[11px] text-ink-500 hover:bg-stone hover:text-navy"
      >
        <User size={10} /> Manage assignments
      </button>
    </div>
  );
}

export default function BookingsKanbanPage() {
  const qc = useQueryClient();
  const [assignBooking, setAssignBooking] = useState<any | null>(null);
  const [newEquipmentId, setNewEquipmentId] = useState('');
  const [newOperatorProfileId, setNewOperatorProfileId] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-kanban'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          `id, status, delivery_date, return_date,
           client:clients(profile:profiles(full_name, company)),
           booking_assignments(
             id, dispatched_at, returned_at,
             equipment:equipment(id, model_name),
             operator:profiles(full_name)
           )`
        )
        .not('status', 'eq', 'cancelled');
      return data ?? [];
    },
  });

  // Available equipment
  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment-available'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment')
        .select('id, model_name, category')
        .in('status', ['available', 'rented'])
        .order('model_name');
      return data ?? [];
    },
  });

  // Operators: use profile_id (UUID) as the value — booking_assignments.operator_id is a UUID ref to profiles
  const { data: operators = [] } = useQuery({
    queryKey: ['operators-available'],
    queryFn: async () => {
      const { data } = await supabase
        .from('operators')
        .select('profile_id, profile:profiles(full_name)')
        .eq('available', true)
        .order('profile_id');
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

  const addAssignment = useMutation({
    mutationFn: async () => {
      if (!newEquipmentId || !assignBooking) throw new Error('Pick equipment');
      const { data, error } = await supabase
        .from('booking_assignments')
        .insert({
          booking_id: assignBooking.id,
          equipment_id: Number(newEquipmentId),
          operator_id: newOperatorProfileId || null,
        })
        .select('id')
        .single();
      if (error) throw error;
      await logAudit('assign_equipment', 'booking_assignment', data.id, {
        booking_id: assignBooking.id,
        equipment_id: newEquipmentId,
        operator_profile_id: newOperatorProfileId || null,
      });
    },
    onSuccess: () => {
      setNewEquipmentId('');
      setNewOperatorProfileId('');
      setAdding(false);
      toast.success('Assignment added');
      qc.invalidateQueries({ queryKey: ['bookings-kanban'] });
      // Refresh modal data
      refreshModal();
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to add'),
  });

  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: number) => {
      const { error } = await supabase.from('booking_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
      await logAudit('remove_assignment', 'booking_assignment', assignmentId, {});
    },
    onSuccess: () => {
      toast.success('Assignment removed');
      qc.invalidateQueries({ queryKey: ['bookings-kanban'] });
      refreshModal();
    },
  });

  const refreshModal = () => {
    if (!assignBooking) return;
    // Re-read the booking with fresh assignments from cache
    qc.invalidateQueries({ queryKey: ['bookings-kanban'] });
  };

  // Keep modal booking data fresh from query cache
  const modalBooking = assignBooking
    ? (bookings.find((b: any) => b.id === assignBooking.id) ?? assignBooking)
    : null;

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
                className={`mb-3 rounded-xl border ${col.color} flex items-center justify-between p-3`}
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
                    <BookingCard key={booking.id} booking={booking} onAssign={setAssignBooking} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Assignment management modal */}
      <Modal
        open={!!assignBooking}
        onClose={() => {
          setAssignBooking(null);
          setAdding(false);
          setNewEquipmentId('');
          setNewOperatorProfileId('');
        }}
        title={`Booking #${assignBooking?.id} — Assignments`}
      >
        <div className="space-y-4">
          {/* Booking meta */}
          <div className="rounded-lg bg-stone/30 px-3 py-2 text-sm">
            <p className="font-medium text-ink-900">
              {modalBooking?.client?.profile?.company ??
                modalBooking?.client?.profile?.full_name ??
                '—'}
            </p>
            <p className="text-xs text-ink-500">
              {modalBooking?.delivery_date
                ? format(new Date(modalBooking.delivery_date), 'MMM d')
                : '—'}{' '}
              →{' '}
              {modalBooking?.return_date
                ? format(new Date(modalBooking.return_date), 'MMM d')
                : '—'}
            </p>
          </div>

          {/* Existing assignments */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Current Assignments
            </p>
            {!modalBooking?.booking_assignments?.length ? (
              <p className="text-ink-400 py-2 text-center text-sm">No assignments yet</p>
            ) : (
              <div className="space-y-2">
                {modalBooking.booking_assignments.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-stone bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {a.equipment?.model_name ?? '—'}
                      </p>
                      <p className="text-xs text-ink-500">
                        {a.operator?.full_name ?? 'No operator'}
                        {a.dispatched_at && (
                          <span className="ml-2 text-blue-600">
                            <Clock size={9} className="inline" />{' '}
                            {format(new Date(a.dispatched_at), 'MMM d')}
                          </span>
                        )}
                        {a.returned_at && (
                          <span className="ml-2 text-green-600">
                            <CheckCircle2 size={9} className="inline" /> returned
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignment.mutate(a.id)}
                      disabled={removeAssignment.isPending || !!a.dispatched_at}
                      className="text-ink-400 flex-shrink-0 rounded p-1 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      title={a.dispatched_at ? 'Cannot remove — already dispatched' : 'Remove'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new assignment */}
          {adding ? (
            <div className="rounded-lg border border-navy/20 bg-navy/5 p-3">
              <p className="mb-3 text-sm font-semibold text-ink-900">Add Assignment</p>
              <div className="space-y-2">
                <div>
                  <label className="text-ink-600 mb-1 block text-xs font-medium">
                    Equipment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEquipmentId}
                    onChange={(e) => setNewEquipmentId(e.target.value)}
                    aria-label="Select equipment"
                    className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  >
                    <option value="">Select equipment…</option>
                    {(equipment as any[]).map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.model_name} ({eq.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-ink-600 mb-1 block text-xs font-medium">
                    Operator (optional)
                  </label>
                  <select
                    value={newOperatorProfileId}
                    onChange={(e) => setNewOperatorProfileId(e.target.value)}
                    aria-label="Select operator"
                    className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  >
                    <option value="">No operator yet</option>
                    {(operators as any[]).map((op) => (
                      <option key={op.profile_id} value={op.profile_id}>
                        {op.profile?.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAdding(false);
                      setNewEquipmentId('');
                      setNewOperatorProfileId('');
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    size="sm"
                    onClick={() => addAssignment.mutate()}
                    disabled={!newEquipmentId || addAssignment.isPending}
                    className="flex-1"
                  >
                    {addAssignment.isPending ? 'Adding…' : 'Add Assignment'}
                  </Btn>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-navy/30 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
            >
              <Plus size={14} /> Add Equipment / Operator
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

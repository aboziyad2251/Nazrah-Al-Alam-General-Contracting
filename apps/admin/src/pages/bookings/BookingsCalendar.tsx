import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader, Card, StatusBadge, Btn } from '@/components/ui/index';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: '#E8B339',
  confirmed: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export default function BookingsCalendarPage() {
  const [detail, setDetail] = useState<any | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-calendar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          `
          id, status, delivery_date, return_date, delivery_address,
          client:clients(profile:profiles(full_name, company)),
          booking_assignments(
            equipment:equipment(model_name, brand),
            operator:profiles(full_name)
          )
        `
        )
        .order('delivery_date');
      return (data ?? []).map((b: any) => ({
        id: String(b.id),
        title: b.client?.profile?.company ?? b.client?.profile?.full_name ?? 'Booking',
        start: b.delivery_date,
        end: b.return_date,
        backgroundColor: STATUS_COLORS[b.status] ?? '#0E1F3A',
        borderColor: 'transparent',
        extendedProps: b,
      }));
    },
  });

  return (
    <div>
      <PageHeader title="Bookings Calendar" subtitle="Full dispatch view" />

      <div className="mb-4 grid grid-cols-4 gap-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="text-ink-700 flex items-center gap-2 text-xs">
            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Card className="flex-1 overflow-hidden p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={bookings}
            eventClick={({ event }) => setDetail(event.extendedProps)}
            height={600}
            eventDisplay="block"
          />
        </Card>

        {/* Detail panel */}
        {detail && (
          <div className="w-72 flex-shrink-0">
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-ink-900">Booking #{detail.id}</p>
                <button onClick={() => setDetail(null)}>
                  <X size={14} className="text-ink-500" />
                </button>
              </div>
              <StatusBadge status={detail.status} />

              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <p className="text-xs text-ink-500">Client</p>
                  <p className="font-medium">
                    {detail.client?.profile?.company ?? detail.client?.profile?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Delivery</p>
                  <p>
                    {detail.delivery_date
                      ? format(new Date(detail.delivery_date), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Return</p>
                  <p>
                    {detail.return_date ? format(new Date(detail.return_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                {detail.delivery_address && (
                  <div>
                    <p className="text-xs text-ink-500">Address</p>
                    <p className="text-xs">{detail.delivery_address}</p>
                  </div>
                )}
                {detail.booking_assignments?.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-ink-500">Equipment & Operators</p>
                    {detail.booking_assignments.map((a: any, i: number) => (
                      <div key={i} className="mb-1 rounded bg-stone/40 px-2 py-1 text-xs">
                        <p className="font-medium">{a.equipment?.model_name}</p>
                        {a.operator && <p className="text-ink-500">{a.operator.full_name}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

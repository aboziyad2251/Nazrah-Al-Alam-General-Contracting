import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader, Skeleton, StatusBadge, EmptyState } from '@/components/ui';
import { CalendarCheck, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Booking {
  id: number;
  status: string;
  delivery_address?: string | null;
  delivery_date?: string | null;
  return_date?: string | null;
  created_at: string;
  quotes?: { project_name: string } | null;
  booking_assignments?: { equipment: { model_name: string; brand: string } }[];
}

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();

  const { data: clientId } = useQuery({
    queryKey: ['client-id', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user!.id)
        .single();
      return data?.id as number | null;
    },
  });

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['bookings', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*,quotes(project_name),booking_assignments(equipment(model_name,brand))')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as Booking[];
    },
  });

  const active =
    bookings?.filter((b) => ['pending', 'confirmed', 'in_progress'].includes(b.status)) ?? [];
  const past = bookings?.filter((b) => ['completed', 'cancelled'].includes(b.status)) ?? [];

  return (
    <div>
      <PageHeader
        title={locale === 'ar' ? 'الحجوزات' : 'Bookings'}
        subtitle={
          locale === 'ar' ? 'إيجاراتك النشطة والسابقة.' : 'Your active and past equipment rentals.'
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !bookings?.length ? (
        <EmptyState
          title="No bookings yet"
          subtitle="Accepted quotes will appear here as confirmed bookings."
          icon={<CalendarCheck size={28} />}
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#5A6573]">
                Active Rentals
              </h2>
              <div className="space-y-3">
                {active.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#5A6573]">
                Past Rentals
              </h2>
              <div className="space-y-3 opacity-75">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const equipment = b.booking_assignments ?? [];
  return (
    <div className="rounded-2xl border border-[#E8EAED] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-3">
            <p className="font-semibold text-[#0F1117]">
              {b.quotes?.project_name ?? `Booking #${b.id}`}
            </p>
            <StatusBadge status={b.status} />
          </div>
          {b.delivery_address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-[#5A6573]">
              <MapPin size={12} /> {b.delivery_address}
            </p>
          )}
          {equipment.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {equipment.map((a, i) => (
                <span
                  key={i}
                  className="rounded-full bg-[#D9DCE0] px-2.5 py-1 text-xs text-[#0F1117]"
                >
                  {a.equipment?.model_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right text-sm text-[#5A6573]">
          {b.delivery_date && <p>Deliver: {format(new Date(b.delivery_date), 'dd MMM yyyy')}</p>}
          {b.return_date && (
            <p className="mt-1">Return: {format(new Date(b.return_date), 'dd MMM yyyy')}</p>
          )}
          <p className="mt-1 text-xs">
            {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

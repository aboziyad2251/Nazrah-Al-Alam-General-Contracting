import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader, Card } from '@/components/ui/index';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function OperatorSchedulePage() {
  const [month, setMonth] = useState(new Date());

  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  const { data: schedule = [] } = useQuery({
    queryKey: ['operator-schedule', start, end],
    queryFn: async () => {
      const { data } = await supabase
        .from('operator_schedule')
        .select(
          `
          id, date, hours_logged, notes,
          operator:operators(id, profile:profiles(full_name)),
          booking_assignment:booking_assignments(booking_id, equipment:equipment(model_name))
        `
        )
        .gte('date', start)
        .lte('date', end);
      return data ?? [];
    },
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators-list-hr'],
    queryFn: async () => {
      const { data } = await supabase
        .from('operators')
        .select('id, profile:profiles(full_name)')
        .order('id');
      return data ?? [];
    },
  });

  const cellData: Record<string, Record<string, typeof schedule>> = {};
  schedule.forEach((s: any) => {
    const opId = s.operator?.id;
    const date = s.date;
    if (!cellData[opId]) cellData[opId] = {};
    if (!cellData[opId][date]) cellData[opId][date] = [];
    cellData[opId][date].push(s);
  });

  const monthHours = operators.reduce((acc: Record<number, number>, op: any) => {
    acc[op.id] = schedule
      .filter((s: any) => s.operator?.id === op.id)
      .reduce((s: number, r: any) => s + Number(r.hours_logged), 0);
    return acc;
  }, {});

  const prevMonth = () =>
    setMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  const nextMonth = () =>
    setMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Operator Schedule" subtitle="Monthly view" />
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-stone">
            <ChevronLeft size={16} />
          </button>
          <span className="w-32 text-center text-sm font-semibold text-ink-900">
            {format(month, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-stone">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Monthly hours summary */}
      <div className="mb-5 flex gap-3 overflow-x-auto">
        {operators.map((op: any) => (
          <Card key={op.id} className="min-w-24 flex-shrink-0 p-3 text-center">
            <p className="text-xl font-bold text-ink-900">{monthHours[op.id] ?? 0}h</p>
            <p className="mt-0.5 truncate text-[10px] text-ink-500">{op.profile?.full_name}</p>
          </Card>
        ))}
      </div>

      {/* Calendar grid */}
      <Card className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-ink-700 sticky left-0 z-10 min-w-28 border-b border-stone bg-[#f8f9fb] px-3 py-2 text-left font-semibold">
                Operator
              </th>
              {days.map((day) => (
                <th
                  key={format(day, 'yyyy-MM-dd')}
                  className="min-w-14 border-b border-stone bg-[#f8f9fb] px-2 py-2 text-center font-medium text-ink-500"
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-ink-400 text-[9px]">{format(day, 'EEE')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operators.map((op: any) => (
              <tr key={op.id} className="border-b border-stone/40 hover:bg-stone/20">
                <td className="sticky left-0 z-10 border-r border-stone bg-white px-3 py-2 font-medium text-ink-900">
                  {op.profile?.full_name}
                </td>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const entries = cellData[op.id]?.[dateStr] ?? [];
                  const totalHrs = entries.reduce(
                    (s: number, e: any) => s + Number(e.hours_logged),
                    0
                  );
                  const isWeekend = [0, 6].includes(getDay(day));
                  return (
                    <td
                      key={dateStr}
                      className={`border-r border-stone/30 px-1 py-1 text-center align-top ${isWeekend ? 'bg-stone/20' : ''}`}
                    >
                      {entries.length > 0 && (
                        <div className="rounded bg-navy/10 px-1 py-0.5 text-[9px] leading-tight text-navy">
                          {entries.map((e: any, i: number) => (
                            <div key={i} className="max-w-12 truncate">
                              {e.booking_assignment?.equipment?.model_name ?? '—'}
                            </div>
                          ))}
                          {totalHrs > 0 && (
                            <div className="font-medium text-navy/70">{totalHrs}h</div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

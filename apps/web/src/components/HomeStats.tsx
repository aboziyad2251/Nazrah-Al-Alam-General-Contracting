import React from 'react';

interface Stat {
  value: string;
  label: string;
}

export function HomeStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-gold py-12">
      <div className="container-section grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="font-poppins text-4xl font-extrabold text-navy">{value}</p>
            <p className="mt-1 text-sm font-medium text-navy/70">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

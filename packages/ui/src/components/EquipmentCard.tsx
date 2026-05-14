import type { Equipment } from '@nazrah/types';
import React from 'react';

import { Card } from './Card';

export interface EquipmentCardProps {
  equipment: Equipment;
  locale?: 'en' | 'ar';
  className?: string;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  locale = 'en',
  className = '',
}) => {
  const name = locale === 'ar' ? equipment.nameAr : equipment.nameEn;

  return (
    <Card variant="bordered" hover className={['group overflow-hidden', className].join(' ')}>
      {/* Image area */}
      <div className="relative -mx-6 -mt-6 mb-4 h-44 overflow-hidden bg-stone">
        {equipment.imageUrl ? (
          <img
            src={equipment.imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-navy/5">
            {/* Generic equipment icon */}
            <svg
              className="h-16 w-16 text-navy/20"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="16"
                width="40"
                height="20"
                rx="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="38" r="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="36" cy="38" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M4 24h40M16 16V10a4 4 0 014-4h8a4 4 0 014 4v6"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        {/* Quantity badge */}
        <span className="absolute end-3 top-3 rounded-full bg-gold px-2.5 py-1 font-poppins text-xs font-bold text-navy">
          ×{equipment.quantity}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="font-poppins text-xs font-medium uppercase tracking-widest text-ink-500">
          {equipment.category}
        </p>
        <h3 className="font-poppins text-base font-bold leading-snug text-navy">{name}</h3>
        <p className="text-sm text-ink-500">
          {equipment.brand}
          {equipment.model ? ` · ${equipment.model}` : ''}
        </p>
      </div>
    </Card>
  );
};

EquipmentCard.displayName = 'EquipmentCard';

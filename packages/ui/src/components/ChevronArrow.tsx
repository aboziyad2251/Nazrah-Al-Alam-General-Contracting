import React from 'react';

export interface ChevronArrowProps {
  /** Direction the arrow points – default right (→) */
  direction?: 'right' | 'left' | 'up' | 'down';
  /** Size of the icon square */
  size?: number;
  /** Tailwind colour class override (e.g. "text-gold") */
  colorClass?: string;
  /** Whether to render inside a circular navy badge */
  badge?: boolean;
  /** Extra className for the wrapper */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

const rotationMap: Record<NonNullable<ChevronArrowProps['direction']>, string> = {
  right: 'rotate-0',
  down: 'rotate-90',
  left: 'rotate-180',
  up: '-rotate-90',
};

/**
 * ChevronArrow – Signature navy chevron with optional badge wrapper.
 *
 * RTL-aware: when the page direction is RTL the "right" chevron automatically
 * mirrors itself via CSS logical-property-friendly `rtl:rotate-180`.
 */
export const ChevronArrow: React.FC<ChevronArrowProps> = ({
  direction = 'right',
  size = 20,
  colorClass,
  badge = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const rotation = rotationMap[direction];

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={[
        'transition-transform duration-200',
        rotation,
        // RTL flip: when direction is explicitly "right" (default arrow-forward), mirror in RTL
        direction === 'right' ? 'rtl:rotate-180' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {/* Thick single chevron – navy by default */}
      <path
        d="M7.5 5L13 10L7.5 15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (badge) {
    return (
      <span
        className={[
          'inline-flex items-center justify-center',
          'rounded-full bg-navy text-white',
          'transition-all duration-200',
          'hover:bg-gold hover:text-navy',
          colorClass ?? '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: size + 20, height: size + 20 }}
      >
        {svg}
      </span>
    );
  }

  return (
    <span
      className={['inline-flex items-center justify-center', colorClass ?? 'text-navy', className]
        .filter(Boolean)
        .join(' ')}
    >
      {svg}
    </span>
  );
};

ChevronArrow.displayName = 'ChevronArrow';

import React, { useId } from 'react';

export interface HexImageProps {
  /** Absolute or relative URL to the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /**
   * Width/height of the hexagonal frame in px.
   * The component is always square – the hex is drawn to fill it.
   */
  size?: number;
  /** Extra className for the wrapping div */
  className?: string;
  /** Optional gold border ring */
  ring?: boolean;
  /** Ring thickness in px (default 3) */
  ringWidth?: number;
}

/**
 * HexImage – renders a photo clipped to a flat-top hexagonal mask.
 *
 * Uses an inline SVG clipPath so the shape is crisp at any size and
 * plays nicely with Next.js Image optimisation when you swap the <img>
 * for <Image> in the consuming app.
 *
 * Gold ring variant: adds a slightly larger hexagonal outline behind the image.
 */
export const HexImage: React.FC<HexImageProps> = ({
  src,
  alt,
  size = 240,
  className = '',
  ring = false,
  ringWidth = 3,
}) => {
  const clipId = useId();

  /**
   * Flat-top regular hexagon points (% of width/height).
   * Six vertices: top-left, top, top-right, bottom-right, bottom, bottom-left
   */
  const hexPoints = (w: number, h: number): string => {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2; // x-radius
    const ry = h / 2; // y-radius

    // flat-top orientation: first vertex at angle=0 (right)
    // rotate offsets by -90° to get pointy-top feel for portrait photos
    const angles = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180);
    return angles
      .map((a) => `${cx + rx * Math.cos(a - Math.PI / 2)},${cy + ry * Math.sin(a - Math.PI / 2)}`)
      .join(' ');
  };

  const points = hexPoints(size, size);
  const ringPad = ringWidth + 2;
  const ringSize = size + ringPad * 2;
  const ringPoints = hexPoints(ringSize, ringSize);

  return (
    <div
      className={['relative inline-block shrink-0', className].filter(Boolean).join(' ')}
      style={{ width: ring ? ringSize : size, height: ring ? ringSize : size }}
    >
      <svg
        width={ring ? ringSize : size}
        height={ring ? ringSize : size}
        viewBox={ring ? `${-ringPad} ${-ringPad} ${ringSize} ${ringSize}` : `0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <polygon points={points} />
          </clipPath>
        </defs>

        {/* Gold ring */}
        {ring && (
          <polygon
            points={ringPoints}
            fill="none"
            stroke="#E8B339"
            strokeWidth={ringWidth}
            transform={`translate(${-ringPad},${-ringPad})`}
          />
        )}

        {/* Clipped image */}
        <image
          href={src}
          x="0"
          y="0"
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </svg>

      {/* Accessible text */}
      <span className="sr-only">{alt}</span>
    </div>
  );
};

HexImage.displayName = 'HexImage';

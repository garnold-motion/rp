// src/components/FlavourFingerprint.jsx
//
// A four-point radar of body / sweetness / acidity / tannins. The point isn't
// precision — it's that each wine ends up with a recognisable silhouette you
// can eyeball across a list far faster than reading four separate bars.

const AXES = [
  { key: 'body', label: 'Body' },
  { key: 'acidity', label: 'Acid' },
  { key: 'sweetness', label: 'Sweet' },
  { key: 'tannins', label: 'Tannin' },
];

const FALLBACK = 5;

const FlavourFingerprint = ({
  wine,
  size = 128,
  showLabels = true,
  accent = 'var(--color-brass)',
  ghost = null, // optional second shape (e.g. the profile the person asked for)
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - (showLabels ? 22 : 6);

  // Clockwise from the top: body, acidity, sweetness, tannins.
  const pointFor = (index, value) => {
    const angle = (Math.PI / 2) * index - Math.PI / 2;
    const dist = (Math.max(1, Math.min(10, value)) / 10) * r;
    return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist];
  };

  const shapeFor = (source) =>
    AXES.map((axis, i) => pointFor(i, source?.[axis.key] ?? FALLBACK).join(',')).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Web rings */}
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={AXES.map((_, i) => {
            const angle = (Math.PI / 2) * i - Math.PI / 2;
            return [cx + Math.cos(angle) * r * scale, cy + Math.sin(angle) * r * scale].join(',');
          }).join(' ')}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}

      {/* Spokes */}
      {AXES.map((_, i) => {
        const angle = (Math.PI / 2) * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        );
      })}

      {/* The profile the person asked for, drawn behind as a dashed outline */}
      {ghost && (
        <polygon
          points={shapeFor(ghost)}
          fill="none"
          stroke="var(--color-cream-faint)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {/* The wine itself */}
      <polygon
        points={shapeFor(wine)}
        fill={accent}
        fillOpacity="0.18"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {AXES.map((axis, i) => {
        const [px, py] = pointFor(i, wine?.[axis.key] ?? FALLBACK);
        return <circle key={axis.key} cx={px} cy={py} r="2" fill={accent} />;
      })}

      {showLabels &&
        AXES.map((axis, i) => {
          const angle = (Math.PI / 2) * i - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (r + 14);
          const ly = cy + Math.sin(angle) * (r + 14);
          return (
            <text
              key={axis.label}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-cream-faint)"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '8px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {axis.label}
            </text>
          );
        })}
    </svg>
  );
};

export default FlavourFingerprint;

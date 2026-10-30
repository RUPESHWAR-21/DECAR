// Small area chart for a 0–1 series. Scales to the series max (at least `floor`).
export default function Sparkline({ values, width = 260, height = 64, floor = 0.05, className = '' }) {
  if (!values.length) {
    return <svg className={className} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} />;
  }
  const max = Math.max(floor, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => [i * step, height - 4 - (v / max) * (height - 8)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L0 ${height} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg
      className={`sparkline ${className}`}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} className="sparkline-area" />
      <path d={line} className="sparkline-line" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3" className="sparkline-dot" />
    </svg>
  );
}

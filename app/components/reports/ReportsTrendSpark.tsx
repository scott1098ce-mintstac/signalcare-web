import { useId } from 'react';
import styles from './reports.module.css';

export type ReportsTrendSparkProps = {
  values?: number[] | null;
  /** Normalised 0–1 fill for single-value indicators (e.g. SLA progress). */
  indicatorLevel?: number | null;
  variant?: 'line' | 'bar';
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  width?: number;
  height?: number;
};

type Point = { x: number; y: number };

function strokeColor(tone: ReportsTrendSparkProps['tone']): string {
  if (tone === 'warning') return 'var(--ds-alert-warning-border)';
  if (tone === 'danger') return 'var(--ds-alert-danger-border)';
  if (tone === 'success') return 'var(--ds-alert-success-border)';
  return 'var(--ds-interactive-default)';
}

function fillColor(tone: ReportsTrendSparkProps['tone']): string {
  if (tone === 'warning') return 'var(--ds-alert-warning-bg)';
  if (tone === 'danger') return 'var(--ds-alert-danger-bg)';
  if (tone === 'success') return 'var(--ds-alert-success-bg)';
  return 'var(--ds-interactive-subtle-bg)';
}

function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(index - 1, 0)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(index + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

function buildAreaPath(points: Point[], baselineY: number): string {
  if (points.length < 2) return '';
  const linePath = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath} L ${last.x},${baselineY} L ${first.x},${baselineY} Z`;
}

/** Lightweight SVG sparkline — no chart libraries. */
export function ReportsTrendSpark({
  values,
  indicatorLevel,
  variant = 'line',
  tone = 'neutral',
  width = 220,
  height = 36,
}: ReportsTrendSparkProps) {
  const gradientId = useId();
  const color = strokeColor(tone);
  const areaColor = fillColor(tone);

  if (indicatorLevel != null && Number.isFinite(indicatorLevel)) {
    const clamped = Math.min(Math.max(indicatorLevel, 0), 1);
    const barWidth = Math.max(clamped * width, clamped > 0 ? 4 : 0);
    return (
      <svg
        className={styles.trendSparkSvg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        <rect
          x={0}
          y={height / 2 - 3}
          width={width}
          height={6}
          rx={3}
          fill="var(--ds-surface-subtle)"
        />
        <rect
          x={0}
          y={height / 2 - 3}
          width={barWidth}
          height={6}
          rx={3}
          fill={color}
          opacity={0.75}
        />
      </svg>
    );
  }

  const series = values?.filter((v) => Number.isFinite(v)) ?? [];
  if (series.length < 2) return null;

  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const range = max - min || 1;
  const pad = 3;

  if (variant === 'bar') {
    const barGap = 4;
    const barWidth = (width - barGap * (series.length - 1)) / series.length;
    return (
      <svg
        className={styles.trendSparkSvg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        {series.map((value, index) => {
          const barHeight = Math.max(((value - min) / range) * (height - pad * 2), 3);
          const x = index * (barWidth + barGap);
          const y = height - pad - barHeight;
          const isLatest = index === series.length - 1;
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill={color}
              opacity={isLatest ? 1 : 0.55}
            />
          );
        })}
      </svg>
    );
  }

  const points: Point[] = series.map((value, index) => ({
    x: pad + (index / (series.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }));

  const baselineY = height - pad;
  const linePath = buildSmoothPath(points);
  const areaPath = buildAreaPath(points, baselineY);
  const lastPoint = points[points.length - 1];

  return (
    <svg
      className={styles.trendSparkSvg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={areaColor} stopOpacity={0.32} />
          <stop offset="100%" stopColor={areaColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={3}
        fill={color}
        stroke="var(--ds-surface-base)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

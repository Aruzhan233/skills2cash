// Recharts needs literal colour values; these mirror the @theme tokens in src/app/globals.css.
export const CHART = {
  grid: "rgba(197,167,255,0.12)", // --color-line
  axis: "rgba(197,167,255,0.22)", // --color-line-strong
  tick: "#a69bb8", // --color-muted
  label: "#d5cde6", // --color-ink-2
  series: "#963fff", // --color-violet
  seriesSoft: "#c5a7ff", // --color-violet-soft
  neutral: "#a69bb8",
  surface: "#1c1236",
  ink: "#f8f6ff", // --color-ink
} as const;

export const chartTooltipStyle = {
  background: "rgba(28,18,54,0.94)",
  border: `1px solid ${CHART.axis}`,
  borderRadius: 12,
  color: CHART.ink,
  fontSize: 12,
  backdropFilter: "blur(16px)",
  boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.7)",
} as const;

export const chartTick = { fill: CHART.tick, fontSize: 12 } as const;

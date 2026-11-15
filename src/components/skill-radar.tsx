"use client";

import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { COMPETENCIES } from "@/lib/competencies";
import type { CompetencyScore } from "@/lib/progress";
import { CHART, chartTooltipStyle } from "@/lib/chart-theme";

export function SkillRadar({ scores, height = 380 }: { scores: CompetencyScore[]; height?: number }) {
  const data = scores.map((s) => ({
    skill: COMPETENCIES[s.key].short,
    full: s.label,
    "Self-reported": s.selfReported ?? 0,
    Demonstrated: s.demonstrated ?? 0,
  }));
  const anyDemonstrated = scores.some((s) => s.demonstrated !== null);
  return (
    <div style={{ width: "100%", height }} role="img" aria-label="Radar chart of competency scores. Exact values are listed in the skills tracker.">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="70%" margin={{ top: 10, right: 48, bottom: 10, left: 48 }}>
          <PolarGrid stroke={CHART.axis} />
          <PolarAngleAxis dataKey="skill" tick={{ fill: CHART.label, fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} tickCount={5} axisLine={false} />
          <Radar name="Self-reported" dataKey="Self-reported" stroke={CHART.neutral} strokeDasharray="4 4" fill={CHART.neutral} fillOpacity={0.06} />
          {anyDemonstrated && (
            <Radar name="Demonstrated" dataKey="Demonstrated" stroke={CHART.seriesSoft} fill={CHART.series} fillOpacity={0.4} />
          )}
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ""}
            formatter={(v, name) => [`${String(v ?? 0)}/100`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: CHART.label }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

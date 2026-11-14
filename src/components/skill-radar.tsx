"use client";

import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { COMPETENCIES } from "@/lib/competencies";
import type { CompetencyScore } from "@/lib/progress";

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
          <PolarGrid stroke="#2e2e40" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#c9c9d6", fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6b6b80", fontSize: 10 }} tickCount={5} axisLine={false} />
          <Radar name="Self-reported" dataKey="Self-reported" stroke="#9a9ab0" strokeDasharray="4 4" fill="#9a9ab0" fillOpacity={0.08} />
          {anyDemonstrated && (
            <Radar name="Demonstrated" dataKey="Demonstrated" stroke="#a78bfa" fill="#8b5cf6" fillOpacity={0.45} />
          )}
          <Tooltip
            contentStyle={{ background: "#14141d", border: "1px solid #34344a", borderRadius: 10, color: "#f4f4f8", fontSize: 12 }}
            labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ""}
            formatter={(v, name) => [`${String(v ?? 0)}/100`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#c9c9d6" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

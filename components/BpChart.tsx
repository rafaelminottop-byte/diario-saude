import { BP_TARGET, fmtDateTime, fmtShortDate } from "@/lib/format";

type Point = { measured_at: string; systolic: number; diastolic: number };

const W = 760, H = 280, L = 44, R = 16, T = 16, B = 40, LO = 50, HI = 170;
const MONO = "JetBrains Mono, ui-monospace, monospace";

export default function BpChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return <p className="muted" style={{ margin: 8 }}>O gráfico aparece quando houver medidas registradas.</p>;
  }
  const pts = [...data].sort((a, b) => a.measured_at.localeCompare(b.measured_at));
  const n = pts.length;
  const clamp = (v: number) => Math.min(HI, Math.max(LO, v));
  const y = (v: number) => T + ((HI - clamp(v)) / (HI - LO)) * (H - T - B);
  const x = (i: number) => (n === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const line = (k: "systolic" | "diastolic") => pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[k])}`).join(" ");
  const step = Math.max(1, Math.ceil(n / 8));
  const last = pts[n - 1];
  const lx = Math.min(x(n - 1), W - R - 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Pressão arterial em ${n} medidas; faixa da meta abaixo de ${BP_TARGET.sys}/${BP_TARGET.dia}`}>
      <rect x={L} y={y(BP_TARGET.sys)} width={W - L - R} height={y(BP_TARGET.dia) - y(BP_TARGET.sys)} fill="var(--band)" />
      {[60, 80, 100, 120, 140, 160].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily={MONO}>{v}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(BP_TARGET.sys)} y2={y(BP_TARGET.sys)} stroke="var(--sys)" strokeDasharray="4 4" opacity={0.55} />
      <line x1={L} x2={W - R} y1={y(BP_TARGET.dia)} y2={y(BP_TARGET.dia)} stroke="var(--dia)" strokeDasharray="4 4" opacity={0.55} />
      <path d={line("systolic")} fill="none" stroke="var(--sys)" strokeWidth={2} />
      <path d={line("diastolic")} fill="none" stroke="var(--dia)" strokeWidth={2} />
      {pts.map((p, i) => (
        <g key={p.measured_at + i}>
          <circle cx={x(i)} cy={y(p.systolic)} r={i === n - 1 ? 5 : 3.5} fill="var(--sys)">
            <title>{`${fmtDateTime(p.measured_at)}: ${p.systolic}/${p.diastolic}`}</title>
          </circle>
          <circle cx={x(i)} cy={y(p.diastolic)} r={i === n - 1 ? 5 : 3.5} fill="var(--dia)">
            <title>{`${fmtDateTime(p.measured_at)}: ${p.systolic}/${p.diastolic}`}</title>
          </circle>
          {(i % step === 0 || i === n - 1) && (
            <text x={x(i)} y={H - 14} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily={MONO}>
              {fmtShortDate(p.measured_at)}
            </text>
          )}
        </g>
      ))}
      <text x={lx} y={y(last.systolic) - 10} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--sys)" fontFamily={MONO}>{last.systolic}</text>
      <text x={lx} y={y(last.diastolic) + 18} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--dia)" fontFamily={MONO}>{last.diastolic}</text>
      <text x={L} y={T - 4} fontSize={10} fill="var(--muted)">mmHg</text>
    </svg>
  );
}

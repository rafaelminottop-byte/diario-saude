const TZ = "America/Sao_Paulo";

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
}

/** Meta usada no app (diretriz brasileira 2025 para a maioria dos adultos). */
export const BP_TARGET = { sys: 130, dia: 80 };

export function aboveTarget(sys: number, dia: number) {
  return sys >= BP_TARGET.sys || dia >= BP_TARGET.dia;
}

export const POSITION_LABEL: Record<string, string> = {
  sentado: "Sentado",
  em_pe: "Em pé",
  deitado: "Deitado",
};

/** "13,5" → 13.5 ; "abc" → null */
export function parseNum(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function str(v: FormDataEntryValue | null, max = 2000): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s.slice(0, max);
}

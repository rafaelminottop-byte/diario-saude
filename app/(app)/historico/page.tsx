import { getUser } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { addEvent } from "../actions";

export const metadata = { title: "Histórico · Diário de Saúde" };

const KIND_LABEL: Record<string, string> = {
  remedio: "Remédio", sintoma: "Sintoma", consulta: "Consulta", nota: "Nota",
};

export default async function HistoricoPage() {
  const { supabase } = await getUser();
  const { data } = await supabase.from("events").select("*").order("happened_on", { ascending: true }).limit(1000);
  const events = data ?? [];
  const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

  return (
    <section aria-labelledby="h-tl">
      <div className="sechead">
        <h1 id="h-tl">Histórico</h1>
        <span className="small muted">Trocas de remédio, sintomas e consultas. ≈ indica data aproximada.</span>
      </div>

      {events.length === 0 ? (
        <div className="empty">Nada registrado ainda. Comece pelo início do tratamento ou pela última consulta.</div>
      ) : (
        <ul className="tl">
          {events.map((e) => (
            <li key={e.id} className={e.kind}>
              <div className="d">{e.approximate ? "≈ " : ""}{fmtDate(e.happened_on)} · {KIND_LABEL[e.kind] ?? e.kind}</div>
              <div>{e.description}</div>
            </li>
          ))}
        </ul>
      )}

      <h2>Adicionar ao histórico</h2>
      <form action={addEvent} className="form">
        <label htmlFor="happened_on">Data<input id="happened_on" name="happened_on" type="date" defaultValue={today} required /></label>
        <label htmlFor="kind">Tipo
          <select id="kind" name="kind" defaultValue="remedio">
            <option value="remedio">Troca de remédio</option><option value="sintoma">Sintoma</option>
            <option value="consulta">Consulta</option><option value="nota">Nota</option>
          </select>
        </label>
        <label className="inline" htmlFor="approximate" style={{ alignSelf: "end", paddingBottom: 8 }}>
          <input id="approximate" name="approximate" type="checkbox" /> Data aproximada
        </label>
        <label htmlFor="description" className="wide">O que aconteceu
          <textarea id="description" name="description" rows={3} required maxLength={2000}
            placeholder="ex.: médico reduziu nebivolol para 2,5 mg porque a pressão estava caindo demais" />
        </label>
        <div className="wide"><button type="submit">Adicionar</button></div>
      </form>
    </section>
  );
}

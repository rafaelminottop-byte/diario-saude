import BpChart from "@/components/BpChart";
import { getUser } from "@/lib/supabase/server";
import { BP_TARGET, POSITION_LABEL, aboveTarget, fmtDateTime } from "@/lib/format";
import { addReading, deleteReading } from "./actions";

export default async function PainelPage() {
  const { supabase } = await getUser();
  const since90 = new Date(Date.now() - 90 * 864e5).toISOString();
  const [{ data: readings }, { data: meds }, { count: openTodos }] = await Promise.all([
    supabase.from("readings").select("*").gte("measured_at", since90).order("measured_at", { ascending: false }).limit(500),
    supabase.from("medications").select("name").eq("active", true),
    supabase.from("todos").select("id", { count: "exact", head: true }).eq("done", false),
  ]);

  const r = readings ?? [];
  const last = r[0];
  const since7 = Date.now() - 7 * 864e5;
  const week = r.filter((x) => new Date(x.measured_at).getTime() >= since7);
  const avg = (k: "systolic" | "diastolic") => Math.round(week.reduce((s, x) => s + x[k], 0) / week.length);

  // Valor padrão do campo: agora, em horário de Brasília
  const nowLocal = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16);

  return (
    <>
      <section aria-label="Resumo">
        <div className="vitals">
          <div className="vital">
            <span className="eyebrow">Última medida</span>
            <span className="big">{last ? <>{last.systolic}/{last.diastolic} <small>mmHg</small></> : "—"}</span>
            <span className="meta">{last ? `${fmtDateTime(last.measured_at)}${last.heart_rate ? ` · ${last.heart_rate} bpm` : ""}` : "Nenhuma ainda"}</span>
          </div>
          <div className="vital">
            <span className="eyebrow">Média 7 dias</span>
            <span className="big">{week.length ? <>{avg("systolic")}/{avg("diastolic")} <small>mmHg</small></> : "—"}</span>
            <span className="meta">
              {week.length ? `${week.length} medida${week.length > 1 ? "s" : ""} · meta < ${BP_TARGET.sys}/${BP_TARGET.dia}` : "Sem medidas nos últimos 7 dias"}
            </span>
          </div>
          <div className="vital">
            <span className="eyebrow">Remédios em uso</span>
            <span className="big">{meds?.length ?? 0}</span>
            <span className="meta">{meds?.map((m) => m.name).join(", ") || "Cadastre na aba Remédios"}</span>
          </div>
          <div className="vital">
            <span className="eyebrow">Pendências</span>
            <span className="big">{openTodos ?? 0}</span>
            <span className="meta">{openTodos ? "exames e consultas a fazer" : "tudo em dia"}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="h-chart">
        <div className="sechead">
          <h2 id="h-chart">Pressão nos últimos 90 dias</h2>
          <div className="legend">
            <span><i className="dot" style={{ background: "var(--sys)" }} />Sistólica</span>
            <span><i className="dot" style={{ background: "var(--dia)" }} />Diastólica</span>
            <span><i className="dot" style={{ background: "var(--band)", border: "1px solid var(--line)" }} />Faixa da meta</span>
          </div>
        </div>
        <div className="chart"><BpChart data={r} /></div>
      </section>

      <section aria-labelledby="h-reg">
        <div className="sechead">
          <h2 id="h-reg">Registrar medida</h2>
          <span className="small muted">Sentado, após 5 minutos de repouso. Tontura de 0 a 10.</span>
        </div>
        <form action={addReading} className="form">
          <label htmlFor="measured_at">Data e hora<input id="measured_at" name="measured_at" type="datetime-local" defaultValue={nowLocal} required /></label>
          <label htmlFor="systolic">Sistólica<input id="systolic" name="systolic" type="number" inputMode="numeric" min={50} max={300} placeholder="128" required /></label>
          <label htmlFor="diastolic">Diastólica<input id="diastolic" name="diastolic" type="number" inputMode="numeric" min={30} max={200} placeholder="82" required /></label>
          <label htmlFor="heart_rate">Batimentos<input id="heart_rate" name="heart_rate" type="number" inputMode="numeric" min={20} max={250} placeholder="70" /></label>
          <label htmlFor="position">Posição
            <select id="position" name="position" defaultValue="sentado">
              <option value="sentado">Sentado</option><option value="em_pe">Em pé</option><option value="deitado">Deitado</option>
            </select>
          </label>
          <label htmlFor="dizziness">Tontura<input id="dizziness" name="dizziness" type="number" min={0} max={10} placeholder="0" /></label>
          <label htmlFor="weight_kg">Peso (kg)<input id="weight_kg" name="weight_kg" type="text" inputMode="decimal" placeholder="opcional" /></label>
          <label htmlFor="notes" className="wide">Observação<input id="notes" name="notes" type="text" maxLength={1000} placeholder="ex.: antes dos remédios, depois do treino" /></label>
          <div className="wide"><button type="submit">Salvar medida</button></div>
        </form>

        <div className="tbl">
          <table>
            <thead><tr><th>Quando</th><th>Pressão</th><th>bpm</th><th>Posição</th><th>Tontura</th><th>Obs.</th><th /></tr></thead>
            <tbody>
              {r.length === 0 && (
                <tr><td colSpan={7} className="muted">Nenhuma medida ainda. Registre a primeira no formulário acima.</td></tr>
              )}
              {r.slice(0, 60).map((x) => (
                <tr key={x.id}>
                  <td className="n">{fmtDateTime(x.measured_at)}</td>
                  <td className={`n ${aboveTarget(x.systolic, x.diastolic) ? "hi" : "okc"}`}>{x.systolic}/{x.diastolic}</td>
                  <td className="n">{x.heart_rate ?? ""}</td>
                  <td>{POSITION_LABEL[x.position ?? ""] ?? ""}</td>
                  <td className="n">{x.dizziness ?? ""}</td>
                  <td>{x.notes ?? ""}</td>
                  <td>
                    <form action={deleteReading}>
                      <input type="hidden" name="id" value={x.id} />
                      <button className="ghost" type="submit" aria-label="Apagar medida">Apagar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

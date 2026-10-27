import { getUser } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { addLabResult, deleteLabResult } from "../actions";

export const metadata = { title: "Exames · Diário de Saúde" };

type Lab = {
  id: string; collected_on: string; test_name: string; value_text: string; unit: string | null;
  reference: string | null; flag: "normal" | "alto" | "baixo"; lab_name: string | null; notes: string | null;
};

export default async function ExamesPage() {
  const { supabase } = await getUser();
  const { data } = await supabase.from("lab_results").select("*").order("collected_on", { ascending: false }).limit(1000);
  const labs = (data ?? []) as Lab[];

  // Última leitura de cada exame + a anterior, para comparar
  const byTest = new Map<string, Lab[]>();
  for (const l of labs) {
    const key = l.test_name.trim().toLowerCase();
    byTest.set(key, [...(byTest.get(key) ?? []), l]);
  }
  const latest = [...byTest.values()].map((list) => ({ cur: list[0], prev: list[1] }))
    .sort((a, b) => a.cur.test_name.localeCompare(b.cur.test_name, "pt-BR"));
  const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

  return (
    <section aria-labelledby="h-ex">
      <div className="sechead">
        <h1 id="h-ex">Exames</h1>
        <span className="small muted">Último resultado de cada exame, com o anterior para comparar</span>
      </div>

      {latest.length === 0 ? (
        <div className="empty">Nenhum exame registrado. Lance os resultados do último laudo no formulário abaixo.</div>
      ) : (
        <div className="tbl">
          <table>
            <thead><tr><th>Exame</th><th>Último</th><th>Data</th><th>Anterior</th><th>Referência</th><th>Situação</th></tr></thead>
            <tbody>
              {latest.map(({ cur, prev }) => (
                <tr key={cur.id}>
                  <td>{cur.test_name}</td>
                  <td className="n">{cur.value_text} {cur.unit ?? ""}</td>
                  <td className="n">{fmtDate(cur.collected_on)}</td>
                  <td className="n muted">{prev ? `${prev.value_text} (${fmtDate(prev.collected_on)})` : "—"}</td>
                  <td className="n">{cur.reference ?? ""}</td>
                  <td><span className={`pill ${cur.flag}`}>{cur.flag}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Lançar resultado</h2>
      <form action={addLabResult} className="form">
        <label htmlFor="collected_on">Data da coleta<input id="collected_on" name="collected_on" type="date" defaultValue={today} required /></label>
        <label htmlFor="test_name">Exame<input id="test_name" name="test_name" required maxLength={120} placeholder="Potássio" list="common-tests" /></label>
        <label htmlFor="value_text">Resultado<input id="value_text" name="value_text" required maxLength={40} placeholder="4,1" /></label>
        <label htmlFor="unit">Unidade<input id="unit" name="unit" maxLength={30} placeholder="mEq/L" /></label>
        <label htmlFor="reference">Referência<input id="reference" name="reference" maxLength={80} placeholder="3,5–5,1" /></label>
        <label htmlFor="flag">Situação
          <select id="flag" name="flag" defaultValue="normal">
            <option value="normal">Normal</option><option value="alto">Alto</option><option value="baixo">Baixo</option>
          </select>
        </label>
        <label htmlFor="lab_name" className="wide">Laboratório<input id="lab_name" name="lab_name" maxLength={120} placeholder="opcional" /></label>
        <div className="wide"><button type="submit">Adicionar resultado</button></div>
        <datalist id="common-tests">
          {["Sódio", "Potássio", "Creatinina", "Ureia", "TSH", "T4 livre", "Glicose", "Hemoglobina glicada", "Hemoglobina",
            "Colesterol total", "HDL", "LDL", "Triglicerídeos", "Ácido úrico", "Aldosterona", "Renina", "Testosterona total",
            "Microalbuminúria", "Lipoproteína (a)"].map((t) => <option key={t} value={t} />)}
        </datalist>
      </form>

      {labs.length > 0 && (
        <>
          <h2>Todos os resultados</h2>
          <div className="tbl">
            <table>
              <thead><tr><th>Data</th><th>Exame</th><th>Resultado</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {labs.map((l) => (
                  <tr key={l.id}>
                    <td className="n">{fmtDate(l.collected_on)}</td>
                    <td>{l.test_name}</td>
                    <td className="n">{l.value_text} {l.unit ?? ""}</td>
                    <td><span className={`pill ${l.flag}`}>{l.flag}</span></td>
                    <td>
                      <form action={deleteLabResult}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="ghost" type="submit">Apagar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

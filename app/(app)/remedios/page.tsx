import { getUser } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { addMedication, toggleMedication } from "../actions";

export const metadata = { title: "Remédios · Diário de Saúde" };

export default async function RemediosPage() {
  const { supabase } = await getUser();
  const { data } = await supabase
    .from("medications")
    .select("*")
    .order("active", { ascending: false })
    .order("created_at", { ascending: true });
  const meds = data ?? [];

  return (
    <section aria-labelledby="h-meds">
      <div className="sechead"><h1 id="h-meds">Remédios</h1></div>
      {meds.length === 0 ? (
        <div className="empty">Nenhum remédio cadastrado. Adicione o primeiro no formulário abaixo.</div>
      ) : (
        <div className="list">
          {meds.map((m) => (
            <div key={m.id} className={`row med ${m.active ? "" : "off"}`}>
              <span>
                <span className="name">{m.name}</span> <span className="dose">{m.dose ?? ""}</span>
                {m.schedule && <span className="muted small"> · {m.schedule}</span>}
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`pill ${m.active ? "on" : "off"}`}>{m.active ? "Em uso" : "Suspenso"}</span>
                <form action={toggleMedication}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="active" value={String(m.active)} />
                  <button className="ghost" type="submit">{m.active ? "Suspender" : "Retomar"}</button>
                </form>
              </span>
              <span className="note">
                {m.started_on && `Desde ${fmtDate(m.started_on)}. `}
                {m.stopped_on && `Suspenso em ${fmtDate(m.stopped_on)}. `}
                {m.notes}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2>Adicionar remédio</h2>
      <form action={addMedication} className="form">
        <label htmlFor="name">Nome<input id="name" name="name" required maxLength={120} placeholder="Olmesartana" /></label>
        <label htmlFor="dose">Dose<input id="dose" name="dose" maxLength={60} placeholder="40 mg" /></label>
        <label htmlFor="schedule">Horário<input id="schedule" name="schedule" maxLength={120} placeholder="1x de manhã" /></label>
        <label htmlFor="started_on">Início<input id="started_on" name="started_on" type="date" /></label>
        <label htmlFor="mnotes" className="wide">Observação<input id="mnotes" name="notes" maxLength={2000} placeholder="motivo, efeitos colaterais, orientação do médico" /></label>
        <div className="wide"><button type="submit">Adicionar</button></div>
      </form>
    </section>
  );
}

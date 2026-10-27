import { getUser } from "@/lib/supabase/server";
import { addTodo, deleteTodo, toggleTodo } from "../actions";

export const metadata = { title: "Pendências · Diário de Saúde" };

export default async function PendenciasPage() {
  const { supabase } = await getUser();
  const { data } = await supabase
    .from("todos")
    .select("*")
    .order("done", { ascending: true })
    .order("created_at", { ascending: true });
  const todos = data ?? [];

  return (
    <section aria-labelledby="h-todo">
      <div className="sechead">
        <h1 id="h-todo">Pendências</h1>
        <span className="small muted">Exames a fazer, perguntas para a próxima consulta</span>
      </div>

      <form action={addTodo} className="form" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
        <label htmlFor="title">Nova pendência<input id="title" name="title" required maxLength={300} placeholder="Pedir sódio e potássio" /></label>
        <button type="submit" style={{ alignSelf: "end" }}>Adicionar</button>
      </form>

      {todos.length === 0 ? (
        <div className="empty">Nenhuma pendência.</div>
      ) : (
        <div className="list">
          {todos.map((t) => (
            <div key={t.id} className={`row todo ${t.done ? "done" : ""}`}>
              <form action={toggleTodo}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="done" value={String(t.done)} />
                <button className="ghost" type="submit" aria-label={t.done ? "Marcar como pendente" : "Marcar como feito"}>
                  {t.done ? "✓ Feito" : "Fazer"}
                </button>
              </form>
              <span className="title">{t.title}</span>
              <form action={deleteTodo}>
                <input type="hidden" name="id" value={t.id} />
                <button className="ghost" type="submit">Apagar</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

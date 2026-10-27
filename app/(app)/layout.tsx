import Link from "next/link";
import { redirect } from "next/navigation";
import NavTabs from "@/components/NavTabs";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import { giveConsent } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("consent_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // LGPD art. 11: consentimento específico antes de tratar dado de saúde
  if (!profile?.consent_at) {
    return (
      <main className="wrap">
        <div className="card narrow" style={{ maxWidth: 560 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Antes de começar</h1>
          <p style={{ margin: 0 }}>
            O Diário de Saúde guarda informações de saúde que você mesmo registra: medidas de pressão,
            remédios, resultados de exames e sintomas.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Esses dados são usados só para organizar o seu histórico e mostrar para você.</li>
            <li>Só você acessa o que registra. Não vendemos nem compartilhamos seus dados.</li>
            <li>Você pode apagar qualquer registro, ou a conta inteira, quando quiser.</li>
            <li>O app organiza informações e não substitui a orientação do seu médico.</li>
          </ul>
          <form action={giveConsent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label className="inline" htmlFor="consent">
              <input id="consent" name="consent" type="checkbox" required />
              Autorizo o tratamento dos meus dados de saúde para essas finalidades.
            </label>
            <button type="submit">Continuar</button>
          </form>
          <form action={signOut}>
            <button className="ghost" type="submit">Sair</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="nav">
        <Link href="/" className="brand">
          <img src="/icon.svg" alt="" width={28} height={28} />
          Diário de Saúde
        </Link>
        <NavTabs />
        <form action={signOut}>
          <button className="ghost" type="submit">Sair</button>
        </form>
      </header>
      {children}
      <p className="foot">
        Organizador pessoal de saúde. Não substitui consulta, diagnóstico ou orientação médica. Mudanças de
        remédio e dose são decididas com o seu médico.
      </p>
    </main>
  );
}

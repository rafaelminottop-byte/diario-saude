import { sendMagicLink } from "./actions";

export const metadata = { title: "Entrar · Diário de Saúde" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  return (
    <main className="wrap">
      <div className="card narrow">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/icon.svg" alt="" width={36} height={36} />
          <h1 style={{ fontSize: "1.6rem" }}>Diário de Saúde</h1>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pressão, remédios e exames organizados num só lugar, prontos para levar ao médico.
        </p>
        {sent ? (
          <p className="okc" role="status">
            Enviamos um link de acesso para o seu e-mail. Abra o link neste mesmo aparelho.
          </p>
        ) : (
          <form action={sendMagicLink} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="email">
              E-mail
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
            </label>
            <button type="submit">Receber link de acesso</button>
          </form>
        )}
        {error && (
          <p className="hi" role="alert">
            {error === "invalid" ? "Digite um e-mail válido." : "Não foi possível enviar o link agora. Tente de novo em alguns minutos."}
          </p>
        )}
        <p className="small muted" style={{ margin: 0 }}>
          Sem senha: a cada acesso você recebe um link por e-mail.
        </p>
      </div>
    </main>
  );
}

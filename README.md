# Diário de Saúde

Organizador pessoal de saúde: medidas de pressão com gráfico, remédios, exames, histórico e pendências, num app instalável no celular e no computador (PWA).

> Posicionamento: **organizador para levar ao médico**. O app registra, organiza e mostra dados. Ele não interpreta resultados nem recomenda doses (ver "Regulação" abaixo).

## Stack

- Next.js 15 (App Router, Server Actions)
- Supabase: login por link mágico (e-mail), Postgres com Row Level Security
- PWA: manifest + ícones, instalável pelo navegador

## Como rodar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com). Escolha a região **São Paulo (sa-east-1)**, para os dados ficarem no Brasil.
2. **SQL Editor → New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (depois troque pela URL de produção)
   - Redirect URLs: adicione `http://localhost:3000/auth/callback` e, depois do deploy, `https://SEU-DOMINIO/auth/callback`
4. **Project Settings → API**: copie a `Project URL` e a chave `anon public`.

### 2. Local

```bash
cp .env.example .env.local   # preencha com os dados do passo 1.4
npm install
npm run dev                  # abre em http://localhost:3000
```

### 3. Deploy (Vercel)

1. Importe este repositório em [vercel.com/new](https://vercel.com/new).
2. Cadastre as 3 variáveis do `.env.example`. `NEXT_PUBLIC_SITE_URL` é a URL final, por exemplo `https://diario-saude.vercel.app`.
3. Adicione `https://SEU-DOMINIO/auth/callback` nas Redirect URLs do Supabase.

### 4. Instalar como app

- **Computador (Chrome/Edge):** abra o site e clique no ícone de instalar, na barra de endereço. O app ganha ícone na área de trabalho e abre em janela própria.
- **Android:** menu ⋮ → *Instalar app*.
- **iPhone:** Safari → Compartilhar → *Adicionar à Tela de Início*.

## Estrutura

```
app/
  login/            login por link mágico
  auth/callback/    troca o código do e-mail pela sessão
  (app)/            área logada (consentimento LGPD no primeiro acesso)
    page.tsx        painel: resumo, gráfico, registro de medidas
    remedios/       remédios em uso e suspensos
    exames/         último resultado de cada exame vs. anterior
    historico/      linha do tempo (trocas, sintomas, consultas)
    pendencias/     exames a fazer, perguntas ao médico
    actions.ts      todas as gravações (Server Actions)
components/         gráfico de pressão (SVG), navegação
lib/                cliente Supabase, formatação
supabase/schema.sql tabelas + RLS
middleware.ts       protege as rotas e renova a sessão
```

## Segurança e LGPD

- Todas as tabelas têm **RLS**: cada usuário só lê e escreve as próprias linhas, garantido pelo banco, não só pelo app.
- O acesso usa só a chave `anon`. A `service_role` **nunca** deve ir para o frontend nem para variáveis `NEXT_PUBLIC_*`.
- No primeiro acesso, o usuário dá **consentimento específico** para tratar dados de saúde (LGPD art. 11), gravado em `profiles.consent_at`.
- Antes de abrir para clientes, ainda faltam: política de privacidade e termos de uso, exportar e apagar a conta pelo app, e registro de quem acessou o quê.

## Regulação (Anvisa)

Software que interpreta dados de saúde para apoiar diagnóstico ou tratamento pode ser classificado como dispositivo médico (RDC 657/2022). Esta versão foi desenhada para ficar do lado de **organizador**: registra, ordena, faz gráfico e compara com a referência do próprio laudo. Recursos como "explicar exames com IA" devem passar por avaliação jurídica antes de entrar.

## Próximos passos

- [ ] Editar registros (hoje: adicionar e apagar)
- [ ] Resumo para consulta: médias, trocas de remédio e exames do período, numa página pronta para imprimir ou enviar
- [ ] Gráfico de evolução por exame
- [ ] Importar laudo em PDF com extração automática dos valores (avaliar regulação)
- [ ] Lembretes de medida e de remédio (notificações)
- [ ] Exportar dados e excluir conta (LGPD)
- [ ] Assinatura (Stripe ou Asaas/Pagar.me para Pix e boleto) e período de teste
- [ ] Política de privacidade e termos de uso

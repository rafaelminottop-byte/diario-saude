# Diário de Saúde

Organizador pessoal de saúde: medidas de pressão com gráfico, remédios, exames, histórico e pendências, num app instalável no celular e no computador (PWA).

> Posicionamento: **organizador para levar ao médico**. O app registra, organiza e mostra dados. Ele não interpreta resultados nem recomenda doses (ver "Regulação" abaixo).

## Stack

- Next.js 15 (App Router, Server Actions)
- Supabase: login por link mágico (e-mail), Postgres com Row Level Security
- PWA: manifest + ícones, instalável pelo navegador

## Como rodar

### 1. No seu computador (fase atual, de graça)

Tudo roda localmente: o app, o banco e o login. Não precisa de conta na nuvem.

**Instalar uma vez (Windows):**
1. [Node.js LTS](https://nodejs.org) (versão 20 ou mais nova).
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/). Na instalação, deixe marcado **Use WSL 2**. Reinicie o PC se ele pedir.
3. [Git](https://git-scm.com/download/win), ou o GitHub Desktop que você já usa, para baixar este repositório.

**Primeira vez, no terminal, dentro da pasta do projeto:**

```bash
npm install
npm run db:start      # sobe o Supabase local (a 1ª vez baixa ~2 GB e leva alguns minutos)
npm run env:local     # cria o .env.local apontando para o banco local
npm run dev           # abre o app em http://localhost:3000
```

**Login local:** digite qualquer e-mail na tela de entrada. O e-mail não sai do seu computador: ele aparece em **http://localhost:54324** (Mailpit). Abra a mensagem e clique no link.

**Dia a dia:** abra o Docker Desktop, depois rode `npm run db:start` e `npm run dev`. Para desligar: `Ctrl+C` no terminal e `npm run db:stop`. Os dados ficam guardados entre um uso e outro.

**Painel do banco local:** http://localhost:54323 (Supabase Studio), para ver as tabelas.

> `npm run db:reset` **apaga** o banco local e recria vazio. Só use se quiser começar do zero.

### 2. Na nuvem (quando for para a internet)

1. Crie um projeto em [supabase.com](https://supabase.com) na região **São Paulo (sa-east-1)**. Use um projeto **só para este app**, nunca o do Fit Padel.
2. **SQL Editor → New query**, cole [`supabase/migrations/20261027000000_init.sql`](supabase/migrations/20261027000000_init.sql) e clique em **Run**.
3. **Authentication → URL Configuration**: Site URL = URL de produção; Redirect URLs = `https://SEU-DOMINIO/auth/callback`.
4. Importe o repositório em [vercel.com/new](https://vercel.com/new) e cadastre as 3 variáveis do `.env.example`, com a `Project URL` e a chave `anon public` de **Project Settings → API**.

Para clientes pagantes, use o plano pago do Supabase: o gratuito pausa o projeto depois de cerca de uma semana sem acesso e não tem backup automático.

### 3. Instalar como app

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
supabase/
  migrations/       tabelas + RLS (aplicadas em ordem)
  config.toml       Supabase local (portas, URLs de login)
scripts/env-local.mjs  gera o .env.local do banco local
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

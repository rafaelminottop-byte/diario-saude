# Diário de Saúde — contexto para o Claude

Leia este arquivo antes de qualquer tarefa neste repositório.

## O produto

App de saúde pessoal para hipertensos e pessoas com tratamento contínuo: registrar pressão, remédios, exames, sintomas e pendências, e chegar à consulta com tudo organizado. Plano: validar com uso próprio do dono (Rafael) e depois **vender como assinatura** no Brasil.

Nasceu de um protótipo no claude.ai (artefato "Diário de Saúde", https://claude.ai/artifact/Q6XVYtG2YdgEmM3yaF74ws), que guarda os dados reais do Rafael. Esses dados serão migrados para o app quando houver banco de produção. Não copie dados pessoais de saúde para dentro do repositório, nem como seed, fixture ou exemplo.

## Decisões já tomadas

- **Posicionamento regulatório:** "organizador para levar ao médico". O app registra, ordena, faz gráfico e compara com a referência do próprio laudo. **Não** interpreta resultados, não sugere causa de sintoma, não recomenda dose. Motivo: software que apoia diagnóstico ou tratamento pode ser dispositivo médico pela Anvisa (RDC 657/2022). Qualquer recurso de IA que explique exames precisa de avaliação jurídica antes de entrar. Na dúvida, pergunte ao Rafael.
- **LGPD:** dado de saúde é dado sensível (art. 11). Consentimento específico no primeiro acesso (`profiles.consent_at`), RLS em todas as tabelas, projeto Supabase na região São Paulo. Nunca expor a chave `service_role` no frontend ou em `NEXT_PUBLIC_*`.
- **Stack:** Next.js 15 (App Router, Server Actions, sem biblioteca de UI), Supabase (login por link mágico + Postgres), PWA instalável. Mesma base do projeto Fit Padel do Rafael.
- **Meta de pressão exibida:** < 130/80 mmHg (`lib/format.ts`, `BP_TARGET`).
- **Fuso:** America/Sao_Paulo (UTC-3, sem horário de verão). Campos `datetime-local` são convertidos com `-03:00` em `actions.ts`.
- **Idioma:** toda a interface em português do Brasil, texto direto, sem jargão de sistema.

## Estado atual (out/2026)

- Feito: login, consentimento, painel (resumo, gráfico de 90 dias, registro de medidas), remédios (suspender/retomar), exames (último vs. anterior), histórico, pendências, manifest + ícones PWA, migração `supabase/migrations/20261027000000_init.sql` com RLS, Supabase local (`supabase/config.toml`, scripts `db:*` e `env:local`).
- Testado: `next build` e `tsc` limpos; redirecionamento para `/login` e manifest respondendo. A migração foi aplicada duas vezes num Postgres 16 com stubs do schema `auth`: roda sem erro, o gatilho cria o perfil, e o RLS esconde as linhas de outro usuário e bloqueia gravação em nome dele. **Ainda não testado ponta a ponta com o Supabase local rodando (login por e-mail no Mailpit).**
- **Fase atual: rodar só no computador do Rafael** (Windows, Supabase local via Docker Desktop), até o app ficar bom. O plano gratuito do Supabase na nuvem já está ocupado (inclusive pelo FIT PADEL SYSTEM, de produção). **Nunca** aplique este schema no projeto do Fit Padel: ele recria `handle_new_user` e o gatilho em `auth.users` e quebraria o cadastro do clube.
- Não feito: deploy na nuvem. Ver README, seção 2.

## Próximos passos, em ordem

1. Ajudar o Rafael a rodar localmente (README seção 1: Docker Desktop, `npm run db:start`, `npm run env:local`, `npm run dev`) e testar o login pelo Mailpit em http://localhost:54324. A nuvem (Supabase pago + Vercel) fica para quando o app estiver bom.
2. Migrar os dados do artefato do claude.ai para o banco (remédios, histórico, exames, medidas, pendências), via script local que lê um export JSON. Nada de dados no git.
3. Editar registros (hoje só dá para adicionar e apagar).
4. Página "Resumo para a consulta": médias do período, trocas de remédio e exames recentes, pronta para imprimir.
5. Gráfico de evolução por exame.
6. Exportar dados e excluir conta (LGPD), política de privacidade e termos.
7. Assinatura (Stripe, ou Asaas/Pagar.me para Pix e boleto) com período de teste.
8. Avaliar com advogado: importação de laudo em PDF com extração por IA.

## Convenções

- Gravações só em `app/(app)/actions.ts` (Server Actions). Toda action chama `auth()` e confia no RLS, nunca em `user_id` vindo do formulário.
- Leituras em Server Components com `getUser()` de `lib/supabase/server.ts`.
- Mudança de schema: criar um novo arquivo em `supabase/migrations/` (`AAAAMMDDHHMMSS_descricao.sql`), nunca editar uma migração já aplicada. Localmente: `npx supabase migration up`. Escreva de forma idempotente e com RLS em toda tabela nova.
- `supabase/config.toml` tem o seed desligado de propósito: nenhum dado pessoal vai para o git.
- Cores só via tokens CSS em `app/globals.css`, com versão clara e escura.
- Antes de commitar: `npm run build` e `npm run typecheck`.

## Sobre o Rafael

Prefere respostas técnicas e com dados, progresso contínuo sem pedir confirmação a cada passo, e que você discorde quando a lógica não fechar. Não é programador em tempo integral: explique o que ele precisa fazer em contas externas (Supabase, Vercel, GitHub) passo a passo.

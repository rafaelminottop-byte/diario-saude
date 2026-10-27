// Gera o .env.local apontando para o Supabase local (rode depois de `npm run db:start`).
import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

let status;
try {
  status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));
} catch {
  console.error("Não consegui ler o Supabase local. Ele está rodando? Rode `npm run db:start` primeiro.");
  process.exit(1);
}

const url = status.API_URL;
const key = status.ANON_KEY || status.PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("O `supabase status` não trouxe API_URL e ANON_KEY. Saída recebida:", Object.keys(status));
  process.exit(1);
}

if (existsSync(".env.local") && !process.argv.includes("--force")) {
  console.error(".env.local já existe. Para sobrescrever: npm run env:local -- --force");
  process.exit(1);
}

writeFileSync(
  ".env.local",
  [
    "# Supabase LOCAL (gerado por scripts/env-local.mjs)",
    `NEXT_PUBLIC_SUPABASE_URL=${url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`,
    "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
    "",
  ].join("\n"),
);
console.log("Pronto: .env.local criado. Agora rode `npm run dev` e abra http://localhost:3000");

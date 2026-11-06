// scripts/gerar-projetos.mjs
// Lista os repositórios da organização marcados com o topic "consultia-projeto"
// e grava o resultado em public/projects.json (consumido por index.html).
import { mkdir, writeFile } from "node:fs/promises";

const ORG = process.env.ORG || "consultiabr";
const TOPIC = process.env.TOPIC || "consultia-projeto";
const token = process.env.GITHUB_TOKEN;

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const res = await fetch(
  `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&sort=updated`,
  { headers }
);
if (!res.ok) {
  console.error(`Falha na API do GitHub: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const repos = await res.json();
const projetos = repos
  .filter((r) => !r.archived && !r.fork && (r.topics || []).includes(TOPIC))
  .map((r) => ({
    nome: r.name,
    descricao: r.description || "",
    url: r.homepage && r.homepage.trim() ? r.homepage.trim() : r.html_url,
    repo: r.html_url,
    linguagem: r.language || "",
    atualizado: r.pushed_at,
  }))
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

await mkdir("public", { recursive: true });
await writeFile(
  "public/projects.json",
  JSON.stringify({ gerado_em: new Date().toISOString(), projetos }, null, 2)
);
console.log(`${projetos.length} projeto(s) listado(s).`);

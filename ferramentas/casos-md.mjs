// ferramentas/casos-md.mjs — escreve casos-teste.md a partir de casos.js.
//   node ferramentas/casos-md.mjs
import fs from "node:fs";
import { casos } from "../casos.js";
import { executar } from "../testes.mjs";

const bloco = (texto) => "```\n" + texto.replace(/\n$/, "") + "\n```\n";
const fase = { "erro-lexico": "erro léxico", "erro-sintatico": "erro sintático", "erro-semantico": "erro semântico" };
const prefixoPagina = { "erro-semantico": "Erro semântico na " };

let md = `# Casos de teste — Rabisco (Fase 2)

Gerado a partir de \`casos.js\` por \`node ferramentas/casos-md.mjs\`. Para conferir tudo: \`node testes.mjs\`
(grava os SVGs em \`testes/svg/\`); as imagens são geradas por \`node ferramentas/imagens.mjs\`.

| Grupo | Casos | Resultado esperado |
|-------|-------|--------------------|
| Válidos da Fase 1 | V1–V5 | SVG em \`testes/svg/\` e imagem em \`testes/png/\` |
| Erro semântico | S1–S3 | lista de erros com a linha; nenhum SVG (captura da página em \`testes/pagina/\`) |
| Inválidos da Fase 1 | I1–I3 | erro léxico ou sintático (as fases seguintes não rodam) |
| Desenho final | D1 | \`desenho-final/robo.svg\` e \`robo.png\` |

`;

for (const c of casos) {
    const r = executar(c.programa);
    md += `## ${c.id} — ${c.nome}\n\n**Cobre:** ${c.cobre}.\n\n`;
    if (c.obs) md += `**Observação:** ${c.obs}\n\n`;
    md += "**Programa:**\n\n" + bloco(c.programa) + "\n";
    if (r.resultado === "valido") {
        md += "**Resultado:** programa válido. SVG gerado (`testes/svg/" + c.id + ".svg`):\n\n" +
              "```svg\n" + r.svg.replace(/\n$/, "") + "\n```\n\n" +
              `![${c.id}](testes/png/${c.id}.png)\n\n`;
    } else {
        md += `**Resultado:** ${fase[r.resultado]}, nenhum SVG gerado. ` +
              (r.resultado === "erro-semantico" ? "Mensagens que a página mostra:" : "Mensagens:") + "\n\n" +
              bloco(r.erros.map((e) => (prefixoPagina[r.resultado] ?? "") + e).join("\n")) + "\n";
        if (r.resultado === "erro-semantico") md += `![página com ${c.id}](testes/pagina/${c.id}.png)\n\n`;
    }
}

fs.writeFileSync(new URL("../casos-teste.md", import.meta.url), md);
console.log("casos-teste.md atualizado (" + casos.length + " casos).");

// testes.mjs — confere todos os casos de casos.js e grava os SVGs gerados.
//   node testes.mjs
//
// Para cada caso: roda léxico -> sintático -> semântico -> gerador e compara com
// o resultado esperado. Os SVGs dos programas válidos vão para testes/svg/.
// Também roda verificações pontuais do gerador (exemplo do enunciado, padrões,
// ordem dos modificadores, grupo sem modificadores).
import { analisarLexico } from "./lexer.js";
import { analisarSintatico } from "./parser.js";
import { verificar } from "./semantica.js";
import { gerar } from "./gerador.js";

// Resumo da AST em texto indentado (usado no resultado esperado dos casos válidos).
export function resumir(no, nivel = 0) {
    const r = (s) => "  ".repeat(nivel) + s;
    const estilo = (e) => Object.entries(e).map(([k, v]) => " " + k + "=" + v).join("");
    switch (no.tipo) {
        case "Programa":
            return [r("Programa"), resumir(no.tela, nivel + 1),
                    ...no.filhos.map((f) => resumir(f, nivel + 1))].join("\n");
        case "Tela":
            return r("Tela " + no.largura + "x" + no.altura);
        case "Reta":
            return r("Reta (" + no.x1 + "," + no.y1 + ")->(" + no.x2 + "," + no.y2 + ")" + estilo(no.estilo));
        case "Circulo":
            return r("Circulo centro=(" + no.cx + "," + no.cy + ") raio=" + no.raio + estilo(no.estilo));
        case "Retangulo":
            return r("Retangulo (" + no.x + "," + no.y + ") " + no.largura + "x" + no.altura + estilo(no.estilo));
        case "Grupo": {
            const mods = no.modificadores.map((m) =>
                m.tipo === "Rotacao" ? "Rotacao(" + m.graus + ")" : "Deslocamento(" + m.dx + "," + m.dy + ")");
            return [r("Grupo [" + mods.join(", ") + "]"),
                    ...no.filhos.map((f) => resumir(f, nivel + 1))].join("\n");
        }
    }
}

// Roda um programa pelas quatro fases. Em cada fase com erro, as seguintes não rodam.
export function executar(programa) {
    const { tokens, erros, linhaFinal } = analisarLexico(programa);
    if (erros.length > 0) {
        return { resultado: "erro-lexico",
                 erros: erros.map((e) => "linha " + e.linha + ': "' + e.lexema + '"') };
    }
    let ast;
    try {
        ast = analisarSintatico(tokens, linhaFinal);
    } catch (falha) {
        return { resultado: "erro-sintatico", erros: [falha.message] };
    }
    const errosSemanticos = verificar(ast);
    if (errosSemanticos.length > 0) {
        return { resultado: "erro-semantico", erros: errosSemanticos.map((e) => e.mensagem), ast };
    }
    return { resultado: "valido", erros: [], resumo: resumir(ast), ast, svg: gerar(ast) };
}

// Conferência simples de SVG bem formado (o Node não tem DOMParser):
// toda tag aberta é fechada na ordem certa e a raiz tem o xmlns.
export function svgBemFormado(svg) {
    if (!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) return "falta <svg xmlns=...> no início";
    const pilha = [];
    for (const [, fecha, nome, auto] of svg.matchAll(/<(\/?)([a-z]+)\b[^>]*?(\/?)>/g)) {
        if (auto) continue;
        if (!fecha) pilha.push(nome);
        else if (pilha.pop() !== nome) return "</" + nome + "> fora de ordem";
    }
    return pilha.length === 0 ? null : "tags sem fechar: " + pilha.join(", ");
}

const normalizar = (s) => s.replace(/\s+/g, " ").replace(/> </g, "><").trim();

// ---- verificações pontuais do gerador ----
function verificacoesDoGerador() {
    const r = [];
    const conferir = (nome, ok, detalhe) => r.push({ nome, ok, detalhe });
    const svgDe = (p) => executar(p).svg ?? "";

    // 1. O exemplo do enunciado, escrito em Rabisko, gera exatamente o SVG esperado.
    const carro = [
        "tela 400 300", "// um carro simples",
        "retangulo 50 150 200 60 fundo azul",
        "grupo move 70 190 {", "  circulo 0 0 25 fundo preto",
        "  grupo gira 45 {", "    reta 0 0 20 0 borda branco espessura 2", "  }", "}",
        "grupo move 200 190 {", "  circulo 0 0 25 fundo preto", "}", ""].join("\n");
    const esperado = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="50" y="150" width="200" height="60" fill="blue" stroke="black" stroke-width="1"/>
  <g transform="translate(70 190)">
    <circle cx="0" cy="0" r="25" fill="black" stroke="black" stroke-width="1"/>
    <g transform="rotate(45)">
      <line x1="0" y1="0" x2="20" y2="0" fill="none" stroke="white" stroke-width="2"/>
    </g>
  </g>
  <g transform="translate(200 190)">
    <circle cx="0" cy="0" r="25" fill="black" stroke="black" stroke-width="1"/>
  </g>
</svg>`;
    const obtido = svgDe(carro);
    conferir("exemplo do enunciado (carro) gera o SVG esperado",
             normalizar(obtido) === normalizar(esperado), obtido);

    // 2. Padrões: estilo ausente -> stroke black, stroke-width 1, fill none.
    const padrao = svgDe("tela 10 10\nreta 0 0 5 5\n");
    conferir("estilo ausente usa os padrões",
             padrao.includes('<line x1="0" y1="0" x2="5" y2="5" fill="none" stroke="black" stroke-width="1"/>'), padrao);

    // 3. Atributo repetido: vale o último.
    const repetido = svgDe("tela 10 10\ncirculo 5 5 2 fundo azul fundo verde borda roxo espessura 3 espessura 0\n");
    conferir("atributo repetido vale o último",
             repetido.includes('fill="green" stroke="purple" stroke-width="0"'), repetido);

    // 4. Hexadecimal passa direto.
    const hex = svgDe("tela 10 10\nretangulo 0 0 5 5 fundo #12AbEf\n");
    conferir("#RRGGBB passa direto", hex.includes('fill="#12AbEf"'), hex);

    // 5. Modificadores na ordem escrita.
    const a = svgDe("tela 10 10\ngrupo gira 90 move 40 0 { reta 0 0 1 1 }\n");
    const b = svgDe("tela 10 10\ngrupo move 40 0 gira 90 { reta 0 0 1 1 }\n");
    conferir("modificadores na ordem escrita",
             a.includes('transform="rotate(90) translate(40 0)"') &&
             b.includes('transform="translate(40 0) rotate(90)"'), a + b);

    // 6. Grupo sem modificadores -> <g> sem transform; grupo vazio -> <g></g>.
    const semMods = svgDe("tela 10 10\ngrupo { }\n");
    conferir("grupo sem modificadores e vazio", /<g>\s*<\/g>/.test(semMods), semMods);

    // 7. Grupos aninhados: a recursão chega ao 3º nível.
    const fundo = svgDe("tela 10 10\ngrupo move 1 1 { grupo gira 2 { grupo move 3 3 { circulo 0 0 1 } } }\n");
    conferir("grupos aninhados (3 níveis)",
             normalizar(fundo).includes('<g transform="translate(1 1)"><g transform="rotate(2)"><g transform="translate(3 3)"><circle'), fundo);

    // 8. Semântica percorre grupos aninhados e devolve todos os erros com a linha.
    const sem = executar("tela 5 5\ngrupo { grupo {\ncirculo 0 0 0\n} }\nretangulo 0 0 0 0\n");
    conferir("semântica em grupos aninhados, com todos os erros",
             JSON.stringify(sem.erros) === JSON.stringify([
                 "linha 3: o círculo precisa ter raio maior que zero",
                 "linha 5: o retângulo precisa ter largura e altura maiores que zero"]),
             JSON.stringify(sem.erros));
    return r;
}

// ---- execução direta: node testes.mjs ----
const rodandoDireto = process.argv[1] &&
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (rodandoDireto) {
    const fs = await import("node:fs");
    const { casos } = await import("./casos.js");
    const pasta = new URL("./testes/svg/", import.meta.url);
    fs.mkdirSync(pasta, { recursive: true });

    let falhas = 0;
    console.log("Casos de teste:");
    for (const c of casos) {
        const r = executar(c.programa);
        let ok = r.resultado === c.esperado.resultado;
        if (ok && c.esperado.resumo !== undefined) ok = r.resumo === c.esperado.resumo;
        if (ok && c.esperado.erros !== undefined) ok = JSON.stringify(r.erros) === JSON.stringify(c.esperado.erros);
        let extra = "";
        if (ok && r.resultado === "valido") {
            const problema = svgBemFormado(r.svg);
            if (problema) { ok = false; extra = " (SVG inválido: " + problema + ")"; }
            else {
                fs.writeFileSync(new URL(c.id + ".svg", pasta), r.svg);
                extra = " -> testes/svg/" + c.id + ".svg";
            }
        }
        if (ok && r.resultado === "erro-semantico") extra = "\n          " + r.erros.join("\n          ");
        console.log("  " + (ok ? "OK    " : "FALHOU") + "  " + c.id + " — " + c.nome + extra);
        if (!ok) { falhas++; console.log("  obtido:", JSON.stringify({ ...r, ast: undefined }, null, 2)); }
    }

    console.log("\nVerificações do gerador e da semântica:");
    for (const v of verificacoesDoGerador()) {
        console.log("  " + (v.ok ? "OK    " : "FALHOU") + "  " + v.nome);
        if (!v.ok) { falhas++; console.log(v.detalhe); }
    }

    console.log(falhas === 0 ? "\nTudo passou." : "\n" + falhas + " falha(s).");
    process.exit(falhas === 0 ? 0 : 1);
}

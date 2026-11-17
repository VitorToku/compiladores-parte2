// main.js — liga a página às fases do compilador:
//   programa -> tokens -> AST -> verificação semântica -> SVG
// Em cada fase com erro, as seguintes não rodam.
import { analisarLexico } from "./lexer.js";
import { analisarSintatico } from "./parser.js";
import { verificar } from "./semantica.js";
import { gerar } from "./gerador.js";
import { validarSVG, desenharSVG, baixarSVG } from "./svg.js";
import { casos } from "./casos.js";

const entrada = document.getElementById("entrada");
const divTokens = document.getElementById("tokens");
const divStatus = document.getElementById("status");
const saida = document.getElementById("saida");
const seletor = document.getElementById("exemplos");
const textoSVG = document.getElementById("texto-svg");
const desenho = document.getElementById("desenho");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
let nomeAtual = "desenho";

// ---- lista de casos de teste ----
for (const caso of casos) {
    const opcao = document.createElement("option");
    opcao.value = caso.id;
    opcao.textContent = caso.id + " — " + caso.nome;
    seletor.appendChild(opcao);
}

function carregarCaso(id) {
    const caso = casos.find((c) => c.id === id);
    if (!caso) return false;
    entrada.value = caso.programa;
    seletor.value = caso.id;
    nomeAtual = caso.id;
    analisar();
    return true;
}

seletor.addEventListener("change", () => carregarCaso(seletor.value));

// ---- tabela de tokens (tipo, lexema, linha) ----
function mostrarTokens(tokens) {
    divTokens.textContent = "";
    if (tokens.length === 0) {
        divTokens.textContent = "(nenhum token)";
        return;
    }
    const tabela = document.createElement("table");
    const cabecalho = tabela.insertRow();
    for (const titulo of ["linha", "tipo", "lexema"]) {
        const th = document.createElement("th");
        th.textContent = titulo;
        cabecalho.appendChild(th);
    }
    for (const token of tokens) {
        const tr = tabela.insertRow();
        tr.insertCell().textContent = token.linha;
        tr.insertCell().textContent = token.tipo;
        tr.insertCell().textContent = token.lexema;
    }
    divTokens.appendChild(tabela);
}

function mostrarStatus(classe, texto) {
    divStatus.textContent = texto;
    divStatus.className = classe;
}

function limparSVG(mensagem) {
    svgAtual = "";
    textoSVG.textContent = mensagem;
    desenho.replaceChildren();
    botaoBaixar.disabled = true;
}

// ---- botão Analisar ----
function analisar() {
    const texto = entrada.value;
    saida.textContent = "";

    // 1. Léxico
    const { tokens, erros, linhaFinal } = analisarLexico(texto);
    mostrarTokens(tokens);
    if (erros.length > 0) {
        mostrarStatus("erro", "Erros léxicos (as fases seguintes não foram executadas):");
        saida.textContent = erros
            .map((e) => "Erro léxico na linha " + e.linha + ': "' + e.lexema + '" não forma nenhum token')
            .join("\n");
        limparSVG("(nenhum SVG: há erros léxicos)");
        return;
    }

    // 2. Sintático
    let ast;
    try {
        ast = analisarSintatico(tokens, linhaFinal);
    } catch (falha) {
        mostrarStatus("erro", "Erro sintático (as fases seguintes não foram executadas):");
        saida.textContent = falha.message;
        limparSVG("(nenhum SVG: há erro sintático)");
        return;
    }

    // 3. Semântico
    const errosSemanticos = verificar(ast);
    if (errosSemanticos.length > 0) {
        mostrarStatus("erro", "Erros semânticos (nenhum SVG foi gerado):");
        saida.textContent = errosSemanticos.map((e) => "Erro semântico na " + e.mensagem).join("\n");
        limparSVG("(nenhum SVG: há erros semânticos)");
        return;
    }

    // 4. Gerador
    mostrarStatus("ok", "Programa válido: sem erros léxicos, sintáticos ou semânticos. AST:");
    saida.textContent = JSON.stringify(ast, null, 2);

    const svg = gerar(ast);
    const validacao = validarSVG(svg);
    textoSVG.textContent = svg;
    if (!validacao.ok) {
        mostrarStatus("erro", "O gerador produziu um SVG inválido: " + validacao.erro);
        desenho.replaceChildren();
        botaoBaixar.disabled = true;
        return;
    }
    svgAtual = svg;
    desenharSVG(svg, desenho);
    botaoBaixar.disabled = false;
}

document.getElementById("botao").addEventListener("click", () => {
    nomeAtual = "desenho";
    analisar();
});
botaoBaixar.addEventListener("click", () => {
    if (svgAtual) baixarSVG(svgAtual, nomeAtual + ".svg");
});

// Programa inicial: ?caso=ID na URL, senão o desenho final (D1).
const pedido = new URLSearchParams(location.search).get("caso");
if (!carregarCaso(pedido) && !carregarCaso("D1")) analisar();

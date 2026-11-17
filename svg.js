// svg.js — valida, desenha e baixa o texto SVG produzido pelo gerador.
//
// Observação: o enunciado diz que a página-base já traz um svg.js pronto.
// Ele não estava no repositório da Fase 1, então este arquivo cumpre o mesmo
// papel. Se a página-base for usada, basta substituir este arquivo pelo dela
// (e ajustar os nomes das funções importadas em main.js, se forem outros).

const XMLNS = "http://www.w3.org/2000/svg";

// Confere se o texto é um SVG bem formado.
// Devolve { ok: true } ou { ok: false, erro: "mensagem" }.
export function validarSVG(texto) {
    const doc = new DOMParser().parseFromString(texto, "image/svg+xml");

    const falha = doc.getElementsByTagName("parsererror")[0];
    if (falha) {
        return { ok: false, erro: "SVG mal formado: " + falha.textContent.trim().split("\n")[0] };
    }

    const raiz = doc.documentElement;
    if (raiz.localName !== "svg") {
        return { ok: false, erro: "o elemento raiz precisa ser <svg>, encontrado <" + raiz.localName + ">" };
    }
    if (raiz.getAttribute("xmlns") !== XMLNS) {
        return { ok: false, erro: 'falta xmlns="' + XMLNS + '" no <svg> (sem ele o arquivo .svg não abre)' };
    }
    return { ok: true };
}

// Desenha o SVG dentro do elemento "destino" (apaga o desenho anterior).
export function desenharSVG(texto, destino) {
    const doc = new DOMParser().parseFromString(texto, "image/svg+xml");
    destino.replaceChildren(document.importNode(doc.documentElement, true));
}

// Baixa o texto como arquivo .svg.
export function baixarSVG(texto, nomeArquivo = "desenho.svg") {
    const blob = new Blob([texto], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

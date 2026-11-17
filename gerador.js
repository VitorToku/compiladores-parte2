// gerador.js — gerador de SVG da linguagem Rabisco (Fase 2).
//
// gerar(ast) devolve o texto SVG. É recursivo, como o paraMermaid da aula de
// AST: cada nó vira o seu elemento SVG e o grupo desce nos filhos.
//
// Semântica fixa (igual para todas as equipes):
//   Tela L A          -> <svg xmlns=... width="L" height="A" viewBox="0 0 L A">
//   Reta / Circulo / Retangulo -> <line> / <circle> / <rect>
//   borda / fundo / espessura  -> stroke / fill / stroke-width
//   estilo ausente    -> stroke="black", stroke-width="1", fill="none"
//   Grupo             -> <g> com os filhos dentro (coordenadas locais)
//   gira N            -> rotate(N)        (graus, sentido horário)
//   move DX DY        -> translate(DX DY) (direita e para baixo)
//   vários modificadores -> todos no transform, na ordem escrita
//
// O gerador supõe uma AST já verificada (semantica.js). Nenhuma biblioteca é usada.

// Tabela de cores: nome na linguagem -> nome de cor do SVG.
// O formato #RRGGBB passa direto, sem conversão.
export const CORES = {
    preto:    "black",
    branco:   "white",
    vermelho: "red",
    verde:    "green",
    azul:     "blue",
    amarelo:  "yellow",
    laranja:  "orange",
    roxo:     "purple",
};

// Padrões quando o atributo não aparece na forma.
export const PADRAO = { borda: "black", fundo: "none", espessura: 1 };

export function corSVG(cor) {
    if (cor.startsWith("#")) return cor;           // #RRGGBB passa direto
    if (cor in CORES) return CORES[cor];
    throw new Error("gerador: cor desconhecida: " + cor);
}

// Os três atributos de estilo, sempre escritos (aplicando os padrões).
// O parser já guarda só o último valor de um atributo repetido.
function atributosDeEstilo(estilo) {
    const fill   = estilo.fundo     !== undefined ? corSVG(estilo.fundo) : PADRAO.fundo;
    const stroke = estilo.borda     !== undefined ? corSVG(estilo.borda) : PADRAO.borda;
    const width  = estilo.espessura !== undefined ? estilo.espessura     : PADRAO.espessura;
    return 'fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '"';
}

// Lista de modificadores -> valor do atributo transform (ordem preservada).
function transformacao(modificadores) {
    return modificadores
        .map((m) => m.tipo === "Rotacao"
            ? "rotate(" + m.graus + ")"
            : "translate(" + m.dx + " " + m.dy + ")")
        .join(" ");
}

export function gerar(ast) {
    const linhas = [];

    // Visita recursiva: "nivel" só controla a indentação do texto gerado.
    function visitar(no, nivel) {
        const recuo = "  ".repeat(nivel);
        switch (no.tipo) {
            case "Programa": {
                const { largura: L, altura: A } = no.tela;
                linhas.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + L + '" height="' + A +
                            '" viewBox="0 0 ' + L + " " + A + '">');
                no.filhos.forEach((f) => visitar(f, nivel + 1));   // ordem do programa
                linhas.push("</svg>");
                break;
            }

            case "Reta":
                linhas.push(recuo + '<line x1="' + no.x1 + '" y1="' + no.y1 + '" x2="' + no.x2 +
                            '" y2="' + no.y2 + '" ' + atributosDeEstilo(no.estilo) + "/>");
                break;

            case "Circulo":
                linhas.push(recuo + '<circle cx="' + no.cx + '" cy="' + no.cy + '" r="' + no.raio +
                            '" ' + atributosDeEstilo(no.estilo) + "/>");
                break;

            case "Retangulo":
                linhas.push(recuo + '<rect x="' + no.x + '" y="' + no.y + '" width="' + no.largura +
                            '" height="' + no.altura + '" ' + atributosDeEstilo(no.estilo) + "/>");
                break;

            case "Grupo": {
                // Grupo sem modificadores: <g> sem o atributo transform.
                const abre = no.modificadores.length > 0
                    ? '<g transform="' + transformacao(no.modificadores) + '">'
                    : "<g>";
                linhas.push(recuo + abre);
                no.filhos.forEach((f) => visitar(f, nivel + 1));    // grupos aninhados
                linhas.push(recuo + "</g>");
                break;
            }

            default:
                throw new Error("gerador: tipo de nó desconhecido: " + no.tipo);
        }
    }

    visitar(ast, 0);
    return linhas.join("\n") + "\n";
}

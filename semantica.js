// semantica.js — verificação semântica da linguagem Rabisco (Fase 2).
//
// A gramática aceita o zero em qualquer número, então alguns programas passam
// pelo parser mas não fazem sentido. Esta fase os detecta:
//
//   1. Tela com largura ou altura igual a zero
//   2. Círculo com raio zero
//   3. Retângulo com largura ou altura zero
//
// verificar(ast) percorre a AST inteira (inclusive grupos aninhados, em
// qualquer profundidade) e devolve TODOS os erros, na ordem do programa:
//   [ { linha, mensagem }, ... ]      (vetor vazio = nenhum erro semântico)

export function verificar(ast) {
    const erros = [];

    function erro(no, mensagem) {
        erros.push({ linha: no.linha, mensagem: "linha " + no.linha + ": " + mensagem });
    }

    // Visita recursiva: confere o nó e desce nos filhos.
    function visitar(no) {
        switch (no.tipo) {
            case "Programa":
                visitar(no.tela);
                no.filhos.forEach(visitar);
                break;

            case "Tela":
                if (no.largura === 0 || no.altura === 0) {
                    erro(no, "a tela precisa ter largura e altura maiores que zero");
                }
                break;

            case "Circulo":
                if (no.raio === 0) {
                    erro(no, "o círculo precisa ter raio maior que zero");
                }
                break;

            case "Retangulo":
                if (no.largura === 0 || no.altura === 0) {
                    erro(no, "o retângulo precisa ter largura e altura maiores que zero");
                }
                break;

            case "Reta":
                // Nenhuma regra semântica: uma reta de comprimento zero é aceita.
                break;

            case "Grupo":
                no.filhos.forEach(visitar);   // a recursão cobre grupos aninhados
                break;

            default:
                throw new Error("verificar: tipo de nó desconhecido: " + no.tipo);
        }
    }

    visitar(ast);
    return erros;
}

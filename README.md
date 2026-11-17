# Rabisco — uma linguagem para desenhar (Fase 2: da AST ao SVG)

Atividade da disciplina **Laboratório de Programação Avançada II · Compiladores**.

Rabisco é uma pequena linguagem de comandos para descrever desenhos. A Fase 1 construiu o léxico, o parser e a AST
(ver [README-fase1.md](README-fase1.md)). Esta fase completa o compilador:

```
programa → tokens → AST → verificação semântica → SVG
```

Em cada fase com erro, as seguintes não rodam. Tudo em JavaScript puro, sem bibliotecas de análise, desenho ou geração de SVG.

## Integrantes

| Nome | RA |
|------|----|
| Alexsander | 20010480 |
| Bruno Costa Dourado | 20010547 |
| João Vitor Leão Bonifácio | 23024758 |
| Vinicius Binda | 23024415 |
| Vitor Hideki Tokunaga | 23024862 |
| Felipe Martins Dos Santos | 23024894 |

## O que mudou na Fase 2

| Arquivo | O que faz |
|---------|-----------|
| `semantica.js` | **novo** — `verificar(ast)` percorre a AST inteira (inclusive grupos aninhados) e devolve `[ { linha, mensagem }, ... ]` |
| `gerador.js` | **novo** — `gerar(ast)` gera o texto SVG de forma recursiva; contém a tabela de cores |
| `parser.js` | **ajustado** — `Tela`, `Reta`, `Circulo`, `Retangulo` e `Grupo` guardam a `linha` |
| `svg.js` | **novo** — valida (DOMParser + `xmlns`), desenha e baixa o SVG (equivalente ao da página-base, que não estava no repositório) |
| `main.js`, `index.html` | página em duas colunas: programa, resultado e tokens à esquerda; desenho, botão *Baixar .svg* e texto SVG à direita |
| `casos.js`, `casos-teste.md` | casos de teste: V1–V5, S1–S3 (erro semântico), I1–I3, D1 (desenho final) |
| `testes.mjs` | confere todos os casos, grava os SVGs e testa pontos do gerador (inclusive o exemplo do enunciado) |

## Semântica (resumo)

| Rabisco | SVG |
|---------|-----|
| `tela L A` | `<svg xmlns="http://www.w3.org/2000/svg" width="L" height="A" viewBox="0 0 L A">` |
| `reta X1 Y1 X2 Y2` · `circulo CX CY R` · `retangulo X Y L A` | `<line>` · `<circle>` · `<rect>` |
| `borda COR` · `fundo COR` · `espessura N` | `stroke` · `fill` · `stroke-width` (padrões: `black`, `none`, `1`) |
| `grupo MODS { ... }` | `<g transform="...">...</g>` (sem modificadores: `<g>`) |
| `gira N` · `move DX DY` | `rotate(N)` · `translate(DX DY)`, na ordem escrita |

| Cor | SVG | Cor | SVG |
|-----|-----|-----|-----|
| `preto` | `black` | `azul` | `blue` |
| `branco` | `white` | `amarelo` | `yellow` |
| `vermelho` | `red` | `laranja` | `orange` |
| `verde` | `green` | `roxo` | `purple` |

`#RRGGBB` passa direto. Erros semânticos: tela com largura/altura zero, círculo com raio zero, retângulo com largura/altura zero.

Documento completo (mapeamento, cores e decisões de projeto): [docs/Rabisco_Semantica_Fase2.pdf](docs/Rabisco_Semantica_Fase2.pdf)
(fonte em [docs/Rabisco_Semantica_Fase2.html](docs/Rabisco_Semantica_Fase2.html)).

## Como executar

A página usa módulos de JavaScript, então precisa de um servidor local:

```
python -m http.server 8000
```

e abra `http://localhost:8000` (ou use a extensão *Live Server* do VS Code). Digite um programa ou escolha um caso na lista e clique em
**Analisar**: o SVG aparece na coluna da direita, já desenhado. `http://localhost:8000/?caso=S3` abre direto um caso.

## Testes e entregáveis

```
node testes.mjs                 # confere todos os casos e grava testes/svg/*.svg
node ferramentas/imagens.mjs    # gera testes/png/*.png e testes/pagina/*.png (usa Edge ou Chrome headless)
node ferramentas/casos-md.mjs   # reescreve casos-teste.md a partir de casos.js
```

| Entregável | Onde |
|------------|------|
| 5.1 Documento de semântica | `docs/Rabisco_Semantica_Fase2.pdf` |
| 5.2 Código | `semantica.js`, `gerador.js`, `parser.js` |
| 5.3 Página funcionando | `index.html` + `main.js` + `svg.js` |
| 5.4 Testes: 5 válidos (`.svg` + imagem) | `testes/svg/V1..V5.svg`, `testes/png/V1..V5.png` |
| 5.4 Testes: erros semânticos (mensagem da página) | `casos-teste.md` (S1–S3), `testes/pagina/S1..S3.png` |
| 5.5 Desenho final | `desenho-final/robo.rab`, `robo.svg`, `robo.png` |

![robô](desenho-final/robo.png)

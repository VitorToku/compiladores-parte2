// ferramentas/imagens.mjs — gera as imagens PNG dos testes usando o Edge/Chrome
// em modo headless (só para a entrega; o compilador não depende disto).
//   node testes.mjs            (gera testes/svg/*.svg)
//   node ferramentas/imagens.mjs
//
// Saída:
//   testes/png/<ID>.png          desenho de cada SVG de testes/svg/
//   testes/pagina/<ID>.png       captura da página com o caso carregado
//                                (casos com erro semântico e o desenho final)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const candidatos = [
    process.env.NAVEGADOR,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const navegador = candidatos.find((c) => fs.existsSync(c));
if (!navegador) {
    console.error("Nenhum Edge/Chrome encontrado. Defina a variável NAVEGADOR com o caminho do executável.");
    process.exit(1);
}

// Servidor estático mínimo (a página usa módulos, então precisa de http://).
const tipos = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
                ".svg": "image/svg+xml", ".css": "text/css", ".json": "application/json" };
const servidor = http.createServer((req, res) => {
    const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let arquivo = path.join(raiz, caminho === "/" ? "index.html" : caminho);
    if (!arquivo.startsWith(raiz) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
        res.writeHead(404).end();
        return;
    }
    res.writeHead(200, { "Content-Type": (tipos[path.extname(arquivo)] ?? "application/octet-stream") + "; charset=utf-8" });
    fs.createReadStream(arquivo).pipe(res);
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const base = "http://127.0.0.1:" + servidor.address().port;

const perfil = fs.mkdtempSync(path.join((await import("node:os")).tmpdir(), "Rabisko-nav-"));

async function capturar(url, saida, largura, altura) {
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    await new Promise((ok, falha) => {
        const p = spawn(navegador, [
            "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
            "--user-data-dir=" + perfil, "--virtual-time-budget=3000",
            "--default-background-color=FFFFFFFF",
            "--window-size=" + largura + "," + altura,
            "--screenshot=" + saida, url,
        ], { stdio: "ignore" });
        p.on("exit", (codigo) => (fs.existsSync(saida) ? ok() : falha(new Error("falhou: " + url + " (" + codigo + ")"))));
    });
    console.log("  " + path.relative(raiz, saida));
}

const pastaSVG = path.join(raiz, "testes", "svg");
if (!fs.existsSync(pastaSVG)) {
    console.error("Rode antes: node testes.mjs");
    process.exit(1);
}

console.log("Desenhos (testes/png):");
for (const nome of fs.readdirSync(pastaSVG).filter((n) => n.endsWith(".svg")).sort()) {
    const texto = fs.readFileSync(path.join(pastaSVG, nome), "utf8");
    const [, w, h] = texto.match(/width="(\d+)" height="(\d+)"/);
    await capturar(base + "/testes/svg/" + nome,
                   path.join(raiz, "testes", "png", nome.replace(".svg", ".png")), Number(w), Number(h));
}

console.log("Capturas da página (testes/pagina):");
for (const id of ["S1", "S2", "S3", "D1"]) {
    await capturar(base + "/index.html?caso=" + id, path.join(raiz, "testes", "pagina", id + ".png"), 1280, 900);
}

// O desenho final também fica junto do programa, em desenho-final/.
fs.copyFileSync(path.join(pastaSVG, "D1.svg"), path.join(raiz, "desenho-final", "robo.svg"));
fs.copyFileSync(path.join(raiz, "testes", "png", "D1.png"), path.join(raiz, "desenho-final", "robo.png"));
console.log("Desenho final: desenho-final/robo.svg e robo.png");

servidor.close();
fs.rmSync(perfil, { recursive: true, force: true });

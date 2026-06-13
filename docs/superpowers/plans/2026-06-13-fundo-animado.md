# Fundo animado (blobs no canvas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o gradiente estático do `body` por um fundo animado de blobs de cor (efeito lava-lamp suave) num `<canvas>` atrás da UI, sem afetar gameplay/save/RNG.

**Architecture:** Novo módulo `js/ui/fundo.js` isolado (não importa engine, não lê state). A lógica de movimento de um blob é uma função pura `passo(blob, dt, limites)` testável em Node; o desenho e o loop `requestAnimationFrame` vivem em `iniciarFundo()`, chamada uma vez no boot. Respeita `prefers-reduced-motion`. Aleatoriedade via `Math.random`.

**Tech Stack:** JS puro (ES modules, sem build), Canvas 2D, CSS. Harness de teste próprio (`tests/harness.js`), rodado com `node tests/todos.js`.

**Convenções:** código/comentários em PT-BR; zero deps; commit termina com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-13-fundo-animado-design.md`

---

## Arquivos tocados

- `js/ui/fundo.js` — **Criar**: `passo()` (puro) + `iniciarFundo()` (canvas/loop).
- `tests/fundo.test.js` — **Criar**: testes de `passo`.
- `tests/todos.js` — **Modificar**: importar `./fundo.test.js`.
- `index.html` — **Modificar**: adicionar `<canvas id="fundo">` antes de `<main id="app">`.
- `css/base.css` — **Modificar**: estilo de `#fundo`.
- `js/main.js` — **Modificar**: chamar `iniciarFundo()` no boot.

---

## Task 1: função pura `passo` + testes

**Files:**
- Create: `js/ui/fundo.js`
- Create: `tests/fundo.test.js`
- Modify: `tests/todos.js`

Contexto: `passo` é a única lógica testável (movimento + quique nas bordas). Modelo de blob:
`{ x, y, vx, vy, raio, cor }`. `passo(blob, dt, limites)` avança `x += vx*dt`, `y += vy*dt`;
se a nova posição sai de `[0, largura]`/`[0, altura]`, fixa na borda e inverte a velocidade
no eixo. Não muta a entrada (retorna novo objeto). `dt` em segundos.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/fundo.test.js`:

```js
import { teste, ok, igual } from "./harness.js";
import { passo } from "../js/ui/fundo.js";

const LIM = { largura: 100, altura: 100 };

teste("fundo: passo avança a posição dentro dos limites", () => {
  const b = { x: 50, y: 50, vx: 10, vy: -20, raio: 8, cor: "x" };
  const n = passo(b, 1, LIM);
  igual(n.x, 60, "x avança vx*dt");
  igual(n.y, 30, "y avança vy*dt");
  igual(n.vx, 10, "vx inalterado dentro dos limites");
  igual(n.vy, -20, "vy inalterado dentro dos limites");
});

teste("fundo: passo quica na borda direita e esquerda", () => {
  const dir = passo({ x: 95, y: 50, vx: 10, vy: 0, raio: 8, cor: "x" }, 1, LIM);
  igual(dir.x, 100, "fixa em largura");
  igual(dir.vx, -10, "inverte vx ao bater na direita");
  const esq = passo({ x: 5, y: 50, vx: -10, vy: 0, raio: 8, cor: "x" }, 1, LIM);
  igual(esq.x, 0, "fixa em 0");
  igual(esq.vx, 10, "inverte vx ao bater na esquerda");
});

teste("fundo: passo quica no topo e na base", () => {
  const base = passo({ x: 50, y: 95, vx: 0, vy: 10, raio: 8, cor: "x" }, 1, LIM);
  igual(base.y, 100, "fixa em altura");
  igual(base.vy, -10, "inverte vy ao bater na base");
  const topo = passo({ x: 50, y: 5, vx: 0, vy: -10, raio: 8, cor: "x" }, 1, LIM);
  igual(topo.y, 0, "fixa em 0");
  igual(topo.vy, 10, "inverte vy ao bater no topo");
});

teste("fundo: passo não muta o blob de entrada", () => {
  const b = { x: 50, y: 50, vx: 10, vy: 10, raio: 8, cor: "x" };
  passo(b, 1, LIM);
  igual(b.x, 50, "x original intacto");
  igual(b.y, 50, "y original intacto");
});
```

E adicionar a linha de import em `tests/todos.js`, logo após `import "./run.test.js";`:

```js
import "./fundo.test.js";
```

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "fundo|falha"`
Esperado: falha (`passo is not a function` / `Cannot find module` se o arquivo ainda não existe). Crie `js/ui/fundo.js` vazio se o erro for de módulo ausente, depois rode de novo e veja os testes de `passo` falharem.

- [ ] **Step 3: Implementar `passo` em `js/ui/fundo.js`**

Criar `js/ui/fundo.js` com (por ora só a função pura; `iniciarFundo` vem na Task 2):

```js
// Fundo decorativo: blobs de cor em movimento lento (lava-lamp) num canvas atrás da UI.
// Isolado do engine/estado; aleatoriedade via Math.random; não afeta o RNG do jogo.

// Avança um blob por dt segundos e reflete a velocidade ao bater nas bordas.
// Função pura: retorna um novo blob, não muta a entrada.
export function passo(blob, dt, limites) {
  let { x, y, vx, vy } = blob;
  x += vx * dt;
  y += vy * dt;
  if (x <= 0) { x = 0; vx = -vx; }
  else if (x >= limites.largura) { x = limites.largura; vx = -vx; }
  if (y <= 0) { y = 0; vy = -vy; }
  else if (y >= limites.altura) { y = limites.altura; vy = -vy; }
  return { ...blob, x, y, vx, vy };
}
```

- [ ] **Step 4: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `76 teste(s), 0 falha(s)` (72 anteriores + 4 novos).

- [ ] **Step 5: Commit**

```bash
git add js/ui/fundo.js tests/fundo.test.js tests/todos.js
git commit -m "feat: passo() puro do fundo animado + testes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: canvas, blobs e loop de animação

**Files:**
- Modify: `js/ui/fundo.js` (adicionar `iniciarFundo` e helpers de desenho)
- Modify: `index.html`
- Modify: `css/base.css`
- Modify: `js/main.js`

Contexto: `iniciarFundo()` é chamada uma vez no boot. Pega `#fundo`, obtém o contexto 2D,
dimensiona à viewport (e a `resize`), cria ~5 blobs com `Math.random`, e anima. Se
`prefers-reduced-motion: reduce`, desenha um único quadro e não inicia o loop. Sem canvas
ou sem contexto → no-op (o gradiente CSS do body permanece).

- [ ] **Step 1: Adicionar `iniciarFundo` e helpers em `js/ui/fundo.js`**

Acrescentar ao FIM de `js/ui/fundo.js` (a função `passo` da Task 1 fica no topo):

```js
// Tons de feltro da paleta, com alfa baixo (sobrepõem o gradiente do body).
const CORES = [
  "rgba(53, 98, 67, 0.55)",   // --feltro-claro
  "rgba(28, 58, 39, 0.55)",   // --feltro-escuro
  "rgba(41, 168, 255, 0.10)", // --azul, bem sutil
];

function novoBlob(largura, altura) {
  const dir = () => (Math.random() < 0.5 ? -1 : 1);
  return {
    x: Math.random() * largura,
    y: Math.random() * altura,
    vx: (8 + Math.random() * 14) * dir(),   // px/s, lento
    vy: (8 + Math.random() * 14) * dir(),
    raio: 160 + Math.random() * 180,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
  };
}

function desenhar(ctx, blobs, largura, altura) {
  ctx.clearRect(0, 0, largura, altura);
  ctx.save();
  ctx.filter = "blur(60px)";
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.raio);
    g.addColorStop(0, b.cor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.raio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function iniciarFundo() {
  const canvas = document.getElementById("fundo");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let largura, altura, blobs;
  function dimensionar() {
    largura = canvas.width = window.innerWidth;
    altura = canvas.height = window.innerHeight;
  }
  dimensionar();
  blobs = Array.from({ length: 5 }, () => novoBlob(largura, altura));

  window.addEventListener("resize", () => {
    dimensionar();
    // Reposiciona blobs que ficaram fora dos novos limites.
    blobs = blobs.map((b) => ({
      ...b,
      x: Math.min(b.x, largura),
      y: Math.min(b.y, altura),
    }));
  });

  const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduzido) {
    desenhar(ctx, blobs, largura, altura);
    return;
  }

  let anterior = performance.now();
  function loop(agora) {
    const dt = Math.min(0.05, (agora - anterior) / 1000); // clamp p/ abas em background
    anterior = agora;
    blobs = blobs.map((b) => passo(b, dt, { largura, altura }));
    desenhar(ctx, blobs, largura, altura);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
```

- [ ] **Step 2: Adicionar o canvas ao `index.html`**

Em `index.html`, dentro do `<body>`, adicionar o canvas como PRIMEIRO filho, antes de
`<main id="app">`. O trecho atual é:

```html
<body>
  <main id="app">
```

Passa a ser:

```html
<body>
  <canvas id="fundo"></canvas>
  <main id="app">
```

- [ ] **Step 3: Estilizar `#fundo` em `css/base.css`**

Adicionar ao FIM de `css/base.css`:

```css
#fundo {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
```

(O `body` mantém o `radial-gradient` atual como fundo-base; o canvas fica por cima dele
e atrás de `#app`, que não declara z-index e portanto fica acima do canvas negativo.)

- [ ] **Step 4: Chamar `iniciarFundo()` no boot (`js/main.js`)**

O `js/main.js` atual é:

```js
import { app } from "./app.js";
import { mostrarTela } from "./ui/screens.js";

app.renderizar = mostrarTela;
mostrarTela(null);
```

Passa a ser:

```js
import { app } from "./app.js";
import { mostrarTela } from "./ui/screens.js";
import { iniciarFundo } from "./ui/fundo.js";

app.renderizar = mostrarTela;
iniciarFundo();
mostrarTela(null);
```

- [ ] **Step 5: Rodar a suíte (garantir que nada quebrou)**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `76 teste(s), 0 falha(s)` (o desenho/loop não é exercitado pelos testes).

- [ ] **Step 6: Smoke headless (sintaxe dos módulos)**

Como não há navegador, validar ao menos que os módulos de UI não têm erro de sintaxe/import
quando carregados sob um shim mínimo de DOM. Rodar:

```bash
node --input-type=module -e '
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], addEventListener(){}, body:{} };
globalThis.window = { addEventListener(){}, matchMedia: () => ({ matches: false }) };
const m = await import("./js/ui/fundo.js");
if (typeof m.iniciarFundo !== "function" || typeof m.passo !== "function") { console.error("FALTA EXPORT"); process.exit(1); }
m.iniciarFundo(); // getElementById -> null => no-op, não deve lançar
console.log("OK fundo.js carrega e iniciarFundo é no-op sem canvas");
'
```

Esperado: `OK fundo.js carrega e iniciarFundo é no-op sem canvas`.

- [ ] **Step 7: Verificação manual (anotar, não bloqueia)**

Servir (`python3 -m http.server 8000`) e confirmar visualmente os blobs se movendo atrás
da UI e o congelamento com `prefers-reduced-motion`. Sem browser neste ambiente → registrar
como pendência visual.

- [ ] **Step 8: Commit**

```bash
git add js/ui/fundo.js index.html css/base.css js/main.js
git commit -m "feat: fundo animado de blobs no canvas (milestone #1)

Canvas atrás da UI com blobs de feltro em movimento lento; respeita
prefers-reduced-motion (quadro estático); isolado do engine/save/RNG.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `76 teste(s), 0 falha(s)`.

# Tabela de mãos + ícone SVG dos coringas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um overlay com a tabela das 9 mãos (nível + chips × mult atuais) acessível de qualquer tela de jogo, e dar a cada carta de Coringa um ícone SVG de jester colorido pelo id.

**Architecture:** `corDoCoringa(id)` é uma função pura em `js/data/jokers.js` (hash do id → cores HSL, testável). `svgCoringa(clara,escura)` em `js/ui/render.js` cria um `<svg>` via `createElementNS` e entra no topo do card de Coringa. A tabela de mãos é `mostrarTabelaMaos(state)` em `js/ui/screens.js` (overlay no padrão de `mostrarBaralho`), acionada por um botão "Mãos" no `cabecalhoRun`; para evitar import circular render↔screens, a função é registrada em `app.mostrarTabelaMaos` no boot.

**Tech Stack:** JS puro (ES modules, sem build), SVG inline, CSS. Harness próprio (`tests/harness.js`), `node tests/todos.js`.

**Convenções:** código/comentários em PT-BR; zero deps; commit termina com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-14-ui-tabela-maos-icone-coringa-design.md`

---

## Arquivos tocados

- `js/data/jokers.js` — **Modificar**: adicionar `corDoCoringa(id)`.
- `tests/data.test.js` — **Modificar**: testes de `corDoCoringa`.
- `js/ui/render.js` — **Modificar**: `svgCoringa`; ícone em `elementoCoringa`; botão "Mãos" em `cabecalhoRun`.
- `js/ui/screens.js` — **Modificar**: `mostrarTabelaMaos(state)`.
- `js/main.js` — **Modificar**: registrar `app.mostrarTabelaMaos` no boot.
- `css/cards.css` — **Modificar**: layout em coluna do `.coringa`; dimensionar `.coringa svg`.
- `css/screens.css` — **Modificar**: `.tabela-maos`.

---

## Task 1: `corDoCoringa` (função pura) + testes

**Files:**
- Modify: `js/data/jokers.js`
- Modify: `tests/data.test.js`

Contexto: cor determinística por id. Hash simples (djb2) da string → inteiro; matiz
`H = hash % 360`; retorna `{ clara: "hsl(H, 65%, 60%)", escura: "hsl(H, 65%, 35%)" }`.
Mesma matiz/saturação, lightness menor na escura.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao import existente na linha 3 de `tests/data.test.js`:

```js
import { CORINGAS, novoCoringa, sufixoEstado, corDoCoringa } from "../js/data/jokers.js";
```

E acrescentar ao FIM de `tests/data.test.js`:

```js
teste("jokers: corDoCoringa é determinística e bem formada", () => {
  const a = corDoCoringa("coringa");
  const b = corDoCoringa("coringa");
  igual(a, b, "mesmo id → mesma cor");
  ok(a.clara.startsWith("hsl("), "clara é hsl");
  ok(a.escura.startsWith("hsl("), "escura é hsl");
});

teste("jokers: corDoCoringa — escura tem lightness menor que a clara", () => {
  const { clara, escura } = corDoCoringa("obelisco");
  const lightness = (s) => Number(s.match(/(\d+)%\)$/)[1]);
  ok(lightness(escura) < lightness(clara), "escura mais escura");
});

teste("jokers: corDoCoringa espalha matizes entre ids diferentes", () => {
  const matiz = (s) => Number(s.match(/hsl\((\d+)/)[1]);
  const hs = ["coringa", "ganancioso", "obelisco", "holograma"].map((id) => matiz(corDoCoringa(id).clara));
  igual(new Set(hs).size, hs.length, "matizes distintos para ids distintos");
});
```

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "corDoCoringa|falha"`
Esperado: falha (`corDoCoringa is not a function`).

- [ ] **Step 3: Implementar `corDoCoringa` em `js/data/jokers.js`**

Adicionar ao FIM de `js/data/jokers.js` (depois de `novoCoringa`):

```js
// Cor determinística de um Coringa, derivada do id (hash djb2 → matiz HSL).
// Devolve { clara, escura } — mesma matiz, a escura com lightness menor (contorno).
export function corDoCoringa(id) {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) + hash + id.charCodeAt(i)) >>> 0;
  const matiz = hash % 360;
  return { clara: `hsl(${matiz}, 65%, 60%)`, escura: `hsl(${matiz}, 65%, 35%)` };
}
```

- [ ] **Step 4: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `94 teste(s), 0 falha(s)` (91 + 3 novos). O essencial: +3 e 0 falhas.

> Se os 4 ids do teste de espalhamento colidirem em matiz (improvável com djb2), troque
> um id por outro dos 25 existentes em `CORINGAS` até obter 4 matizes distintos. Verifique
> rodando: `node -e 'import("./js/data/jokers.js").then(m=>console.log(["coringa","ganancioso","obelisco","holograma"].map(id=>m.corDoCoringa(id).clara)))'`

- [ ] **Step 5: Commit**

```bash
git add js/data/jokers.js tests/data.test.js
git commit -m "feat: corDoCoringa — cor determinística por id (UI dos coringas)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: ícone SVG no card do Coringa

**Files:**
- Modify: `js/ui/render.js`
- Modify: `css/cards.css`

Contexto: `svgCoringa(clara, escura)` cria um `<svg>` de chapéu de jester via
`createElementNS` (SVG exige namespace; `el()` usa `createElement`). Entra como primeiro
filho do card em `elementoCoringa`, antes do `<span class="nome">`. Raridade, tooltip,
venda e drag ficam intactos.

- [ ] **Step 1: Adicionar `svgCoringa` e o import de `corDoCoringa` em `js/ui/render.js`**

O arquivo já importa de `../data/jokers.js` (linha ~10:
`import { sufixoEstado } from "../data/jokers.js";`). Trocar por:

```js
import { sufixoEstado, corDoCoringa } from "../data/jokers.js";
```

Adicionar a função `svgCoringa` (perto de `elementoCarta`/`el`, no topo do arquivo após `el`):

```js
// Cria um ícone SVG de chapéu de jester nas cores dadas. SVG precisa de namespace,
// então não usa o helper el() (que chama createElement). Decorativo (aria-hidden).
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, atributos) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(atributos)) node.setAttribute(k, v);
  return node;
}
export function svgCoringa(clara, escura) {
  const svg = svgEl("svg", { viewBox: "0 0 48 48", class: "icone-coringa", "aria-hidden": "true" });
  // Chapéu de jester: três pontas com guizos + faixa da base.
  const chapeu = svgEl("path", {
    d: "M24 6 L14 22 L8 14 L10 30 L38 30 L40 14 L34 22 Z",
    fill: clara, stroke: escura, "stroke-width": "2", "stroke-linejoin": "round",
  });
  const faixa = svgEl("rect", { x: "8", y: "30", width: "32", height: "6", rx: "3", fill: escura });
  const g1 = svgEl("circle", { cx: "8", cy: "13", r: "3", fill: escura });
  const g2 = svgEl("circle", { cx: "24", cy: "5", r: "3", fill: escura });
  const g3 = svgEl("circle", { cx: "40", cy: "13", r: "3", fill: escura });
  svg.append(chapeu, faixa, g1, g2, g3);
  return svg;
}
```

- [ ] **Step 2: Inserir o ícone em `elementoCoringa`**

Hoje `elementoCoringa` começa assim:

```js
export function elementoCoringa(coringa, indice = null) {
  const def = coringa.def;
  const elemento = el("div", { classe: `coringa raridade-${def.raridade}` },
    el("span", { classe: "nome" }, def.nome),
  );
```

Trocar a criação do `elemento` para incluir o ícone como primeiro filho:

```js
export function elementoCoringa(coringa, indice = null) {
  const def = coringa.def;
  const { clara, escura } = corDoCoringa(def.id);
  const elemento = el("div", { classe: `coringa raridade-${def.raridade}` },
    svgCoringa(clara, escura),
    el("span", { classe: "nome" }, def.nome),
  );
```

(O restante de `elementoCoringa` — tooltip, venda, drag — fica exatamente igual.)

- [ ] **Step 3: CSS do layout em coluna + dimensão do ícone (`css/cards.css`)**

Hoje `.coringa, .consumivel` usa `align-items: flex-end; justify-content: center;` para
jogar o nome para a base. Para o coringa empilhar ícone+nome, adicionar regras
específicas ao FIM de `css/cards.css`:

```css
.coringa { flex-direction: column; justify-content: space-between; align-items: center; }
.coringa .nome { width: 100%; }
.icone-coringa { width: 70%; height: auto; margin-top: 4px; pointer-events: none; }
```

(O `.consumivel` mantém o comportamento atual — só `.coringa` muda para coluna.)

- [ ] **Step 4: Rodar a suíte (nada de engine quebrou)**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `94 teste(s), 0 falha(s)` (mudança de UI; testes não a exercitam).

- [ ] **Step 5: Smoke headless (svgCoringa cria um nó svg)**

```bash
node --input-type=module -e '
let criados = [];
globalThis.document = {
  createElementNS: (ns, tag) => { const n = { tagName: tag, _attrs:{}, children:[], setAttribute(k,v){this._attrs[k]=v;}, append(...c){this.children.push(...c);} }; criados.push(n); return n; },
  createElement: () => ({ className:"", setAttribute(){}, append(){}, addEventListener(){}, classList:{add(){},remove(){}}, style:{}, dataset:{} }),
  getElementById: () => null, querySelectorAll: () => [], body:{ append(){} },
};
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const r = await import("./js/ui/render.js");
const svg = r.svgCoringa("hsl(10,65%,60%)","hsl(10,65%,35%)");
if (svg.tagName !== "svg") { console.error("não é svg:", svg.tagName); process.exit(1); }
console.log("OK svgCoringa retorna <svg> com", svg.children.length, "filhos");
'
```
Esperado: `OK svgCoringa retorna <svg> com 5 filhos`.

- [ ] **Step 6: Verificação manual (anotar, não bloqueia)**

Servir e confirmar: cada coringa mostra o ícone colorido no topo, nome embaixo; cores
distintas entre coringas; venda e drag funcionam. Sem browser aqui → pendência visual.

- [ ] **Step 7: Commit**

```bash
git add js/ui/render.js css/cards.css
git commit -m "feat: ícone SVG de jester nos cards de Coringa, colorido pelo id

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: tabela de mãos (overlay + botão "Mãos")

**Files:**
- Modify: `js/ui/screens.js`
- Modify: `js/ui/render.js`
- Modify: `js/main.js`
- Modify: `css/screens.css`

Contexto: `mostrarTabelaMaos(state)` cria um overlay (padrão de `mostrarBaralho`) com a
tabela das 9 mãos. Botão "Mãos" no `cabecalhoRun`. Para render.js não importar screens.js
(evita ciclo), a função é registrada em `app.mostrarTabelaMaos` no boot e chamada de lá.
`MAOS` e `valoresDaMao` já são importados em screens.js.

- [ ] **Step 1: Implementar `mostrarTabelaMaos` em `js/ui/screens.js`**

Adicionar perto de `mostrarBaralho` (que é a referência de overlay):

```js
function mostrarTabelaMaos(state) {
  const overlay = el("div", { classe: "overlay", onclick: () => overlay.remove() });
  const painel = el("div", { classe: "painel-baralho tabela-maos", onclick: (e) => e.stopPropagation() },
    el("h3", {}, "Mãos de pôquer"),
    ...Object.keys(MAOS).map((tipo) => {
      const nivel = state.niveisMaos[tipo];
      const { chips, mult } = valoresDaMao(tipo, nivel);
      return el("div", { classe: "linha-mao" },
        el("span", { classe: "nome-mao" }, MAOS[tipo].nome),
        el("span", { classe: "descricao" }, `nv. ${nivel}`),
        el("span", {}, el("span", { classe: "numero chips" }, String(chips)), " × ", el("span", { classe: "numero mult" }, String(mult))),
      );
    }),
  );
  overlay.append(painel);
  document.body.append(overlay);
}
```

> Nota: o `stopPropagation` no painel impede que clicar na tabela feche o overlay; só o
> clique no fundo (overlay) fecha. `mostrarBaralho` não faz isso, mas aqui a tabela é
> "consultável", então é desejável.

- [ ] **Step 2: Registrar `app.mostrarTabelaMaos` no boot (`js/main.js`)**

`js/main.js` hoje:

```js
import { app } from "./app.js";
import { mostrarTela } from "./ui/screens.js";
import { iniciarFundo } from "./ui/fundo.js";

app.renderizar = mostrarTela;
iniciarFundo();
mostrarTela(null);
```

`mostrarTabelaMaos` precisa ser exportada de screens.js e registrada. Primeiro, exportá-la
em screens.js (trocar `function mostrarTabelaMaos` por `export function mostrarTabelaMaos`).
Depois, em main.js:

```js
import { app } from "./app.js";
import { mostrarTela, mostrarTabelaMaos } from "./ui/screens.js";
import { iniciarFundo } from "./ui/fundo.js";

app.renderizar = mostrarTela;
app.mostrarTabelaMaos = mostrarTabelaMaos;
iniciarFundo();
mostrarTela(null);
```

- [ ] **Step 3: Botão "Mãos" no `cabecalhoRun` (`js/ui/render.js`)**

Hoje `cabecalhoRun` é:

```js
export function cabecalhoRun(state) {
  return el("header", { classe: "cabecalho-run" },
    el("span", { classe: "numero dinheiro" }, `$${state.dinheiro}`),
    el("span", {}, `Ante ${state.ante}/8`),
    el("span", { classe: "descricao" }, `Rodadas vencidas: ${state.estatisticas.rodadas}`),
    el("span", { classe: "descricao" }, `Seed: ${codificarSeed(state.semente)}`),
  );
}
```

Acrescentar o botão como último filho (chama `app.mostrarTabelaMaos`, registrado no boot):

```js
export function cabecalhoRun(state) {
  return el("header", { classe: "cabecalho-run" },
    el("span", { classe: "numero dinheiro" }, `$${state.dinheiro}`),
    el("span", {}, `Ante ${state.ante}/8`),
    el("span", { classe: "descricao" }, `Rodadas vencidas: ${state.estatisticas.rodadas}`),
    el("span", { classe: "descricao" }, `Seed: ${codificarSeed(state.semente)}`),
    el("button", { classe: "botao botao-mini", onclick: () => app.mostrarTabelaMaos(state) }, "Mãos"),
  );
}
```

(`app` já está importado no topo de render.js: `import { app, atualizar } from "../app.js";`.)

- [ ] **Step 4: CSS da tabela (`css/screens.css`)**

Adicionar ao FIM de `css/screens.css`:

```css
.tabela-maos { min-width: 320px; }
.tabela-maos h3 { margin-bottom: 0.6rem; }
.linha-mao {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--painel-borda);
}
.linha-mao:last-child { border-bottom: none; }
.linha-mao .nome-mao { font-weight: 600; }
```

- [ ] **Step 5: Rodar a suíte**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `94 teste(s), 0 falha(s)`.

- [ ] **Step 6: Smoke headless (módulos carregam; tabela usa app.mostrarTabelaMaos)**

```bash
node --input-type=module -e '
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ className:"", setAttribute(){}, append(){}, addEventListener(){}, classList:{add(){},remove(){}}, style:{}, dataset:{} }), createElementNS: () => ({ tagName:"svg", setAttribute(){}, append(){} }), body:{ append(){} } };
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const s = await import("./js/ui/screens.js");
if (typeof s.mostrarTabelaMaos !== "function") { console.error("mostrarTabelaMaos não exportada"); process.exit(1); }
console.log("OK screens.js exporta mostrarTabelaMaos");
'
```
Esperado: `OK screens.js exporta mostrarTabelaMaos`.

- [ ] **Step 7: Verificação manual (anotar, não bloqueia)**

Servir e confirmar: botão "Mãos" no cabeçalho de todas as telas de jogo; abre overlay com
as 9 mãos, nível e chips × mult atuais; clicar na tabela não fecha; clicar fora fecha. Sem
browser → pendência visual.

- [ ] **Step 8: Commit**

```bash
git add js/ui/screens.js js/ui/render.js js/main.js css/screens.css
git commit -m "feat: tabela de mãos de pôquer em overlay (botão Mãos no cabeçalho)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `94 teste(s), 0 falha(s)`.

Run: `grep -rn "createElementNS" js/ui/render.js` → confirma que o SVG usa namespace.

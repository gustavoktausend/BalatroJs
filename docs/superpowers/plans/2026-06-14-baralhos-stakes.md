# Baralhos e Stakes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir escolher um baralho (modifica recursos iniciais) e um stake (escala alvos/economia) no início da run, ambos dados passivos sem mexer nas cartas.

**Architecture:** `js/data/baralhos.js` (4) e `js/data/stakes.js` (3) são dados passivos. `criarRun(semente, baralhoId, stakeId)` guarda `state.baralho`/`state.stake` e calcula o dinheiro inicial. Os efeitos são consultas nos pontos de integração: `iniciarBlind` (mãos/descartes do baralho + alvo com multStake do stake) e `alvoDaBlind(ante, tipo, chefeId, multStake=1)`. A tela de título ganha dois `<select>`.

**Tech Stack:** JS puro (ES modules, sem build), harness próprio, `node tests/todos.js`.

**Convenções:** código/comentários em PT-BR; zero deps; commit termina com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-14-baralhos-stakes-design.md`

**Backward-compat verificada:** `alvoDaBlind` ganha 4º parâmetro `multStake` **com default 1**, então `tests/blinds.test.js` (`alvoDaBlind(1,"pequena",null)` etc.) segue passando. `state.test.js` não checa shape exaustivo. Run Padrão/Branco = comportamento atual.

---

## Arquivos tocados

- `js/data/baralhos.js` — **Criar**: 4 baralhos.
- `js/data/stakes.js` — **Criar**: 3 stakes.
- `js/state.js` — **Modificar**: `criarRun(semente, baralhoId, stakeId)`; `state.baralho/stake`; dinheiro calculado; `VERSAO_SAVE` 3→4.
- `js/engine/blinds.js` — **Modificar**: `alvoDaBlind(..., multStake=1)`.
- `js/engine/run.js` — **Modificar**: `iniciarBlind` (mãos/descartes do baralho; alvo com multStake).
- `js/ui/screens.js` — **Modificar**: seletores no título; alvo na seleção com multStake.
- `js/ui/render.js` — **Modificar**: `cabecalhoRun` mostra baralho/stake.
- `css/screens.css` — **Modificar**: estilo dos seletores.
- `tests/baralhos-stakes.test.js` — **Criar**.
- `tests/state.test.js` — **Modificar**: assert baralho/stake default.
- `tests/todos.js` — **Modificar**: importar o novo teste.

---

## Task 1: dados + criarRun com baralho/stake + save v4

**Files:**
- Create: `js/data/baralhos.js`, `js/data/stakes.js`, `tests/baralhos-stakes.test.js`
- Modify: `js/state.js`, `tests/state.test.js`, `tests/todos.js`

- [ ] **Step 1: Criar `tests/baralhos-stakes.test.js` (parte de dados/criarRun) e registrar**

```js
import { teste, ok, igual } from "./harness.js";
import { BARALHOS } from "../js/data/baralhos.js";
import { STAKES } from "../js/data/stakes.js";
import { criarRun } from "../js/state.js";

teste("baralhos: 4 baralhos com campos esperados; padrão neutro", () => {
  igual(Object.keys(BARALHOS).length, 4);
  for (const id of ["padrao", "vermelho", "azul", "amarelo"]) ok(BARALHOS[id], `falta ${id}`);
  const p = BARALHOS.padrao;
  igual([p.dinheiroInicial, p.maosBonus, p.descartesBonus], [0, 0, 0], "padrão neutro");
  igual(BARALHOS.vermelho.descartesBonus, 1);
  igual(BARALHOS.azul.maosBonus, 1);
  igual(BARALHOS.amarelo.dinheiroInicial, 10);
});

teste("stakes: 3 stakes; branco neutro", () => {
  igual(Object.keys(STAKES).length, 3);
  igual(STAKES.branco.multAlvo, 1);
  igual(STAKES.branco.dinheiroInicial, 0);
  igual(STAKES.vermelho.multAlvo, 1.25);
  igual(STAKES.dourado.multAlvo, 1.25);
  igual(STAKES.dourado.dinheiroInicial, -1);
});

teste("criarRun: baralho/stake default são padrao/branco e dinheiro 4", () => {
  const s = criarRun(1);
  igual(s.baralho, "padrao");
  igual(s.stake, "branco");
  igual(s.dinheiro, 4);
});

teste("criarRun: dinheiro inicial combina baralho + stake (piso 0)", () => {
  igual(criarRun(1, "amarelo", "branco").dinheiro, 14, "Amarelo +10");
  igual(criarRun(1, "padrao", "dourado").dinheiro, 3, "Dourado -1");
  igual(criarRun(1, "amarelo", "dourado").dinheiro, 13, "empilha");
});

teste("criarRun: mesma seed+baralho+stake reproduz a run", () => {
  igual(criarRun(42, "azul", "vermelho").chefesPorAnte, criarRun(42, "azul", "vermelho").chefesPorAnte);
});
```

E adicionar a `tests/todos.js`, logo após `import "./run.test.js";`:

```js
import "./baralhos-stakes.test.js";
```

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "baralhos|stakes|Cannot|falha"`
Esperado: `Cannot find module ../js/data/baralhos.js`.

- [ ] **Step 3: Criar `js/data/baralhos.js`**

```js
// Baralhos: escolhidos no início da run, modificam recursos iniciais (passivos).
// Não tocam nas cartas (sem baralho persistente). Padrão = neutro.
const LISTA = [
  { id: "padrao",   nome: "Baralho Padrão",   descricao: "Sem modificadores.",        dinheiroInicial: 0,  maosBonus: 0, descartesBonus: 0 },
  { id: "vermelho", nome: "Baralho Vermelho", descricao: "+1 descarte por rodada.",   dinheiroInicial: 0,  maosBonus: 0, descartesBonus: 1 },
  { id: "azul",     nome: "Baralho Azul",     descricao: "+1 mão por rodada.",        dinheiroInicial: 0,  maosBonus: 1, descartesBonus: 0 },
  { id: "amarelo",  nome: "Baralho Amarelo",  descricao: "Começa com +$10.",          dinheiroInicial: 10, maosBonus: 0, descartesBonus: 0 },
];

export const BARALHOS = Object.fromEntries(LISTA.map((b) => [b.id, b]));
```

- [ ] **Step 4: Criar `js/data/stakes.js`**

```js
// Stakes: nível de dificuldade da run (passivo). multAlvo escala os alvos das blinds;
// dinheiroInicial ajusta o dinheiro de partida. Branco = base.
const LISTA = [
  { id: "branco",   nome: "Stake Branco",   descricao: "Dificuldade normal.",                   multAlvo: 1,    dinheiroInicial: 0 },
  { id: "vermelho", nome: "Stake Vermelho", descricao: "Alvos das blinds +25%.",                multAlvo: 1.25, dinheiroInicial: 0 },
  { id: "dourado",  nome: "Stake Dourado",  descricao: "Alvos +25% e começa com $1 a menos.",   multAlvo: 1.25, dinheiroInicial: -1 },
];

export const STAKES = Object.fromEntries(LISTA.map((s) => [s.id, s]));
```

- [ ] **Step 5: `criarRun` com baralho/stake e dinheiro calculado (`js/state.js`)**

Adicionar imports no topo (há `import { CORINGAS } from "./data/jokers.js";`):

```js
import { BARALHOS } from "./data/baralhos.js";
import { STAKES } from "./data/stakes.js";
```

Trocar `export const VERSAO_SAVE = 3;` por:

```js
export const VERSAO_SAVE = 4;
```

A assinatura e o corpo de `criarRun` mudam. Hoje é `export function criarRun(semente = Date.now() % 2 ** 31) {` com `dinheiro: 4,` e os campos. Trocar a assinatura por:

```js
export function criarRun(semente = Date.now() % 2 ** 31, baralhoId = "padrao", stakeId = "branco") {
  const baralho = BARALHOS[baralhoId] || BARALHOS.padrao;
  const stake = STAKES[stakeId] || STAKES.branco;
```

(inserir essas duas linhas logo após a abertura da função, antes de `const state = {`).

Trocar a linha `dinheiro: 4,` por:

```js
    dinheiro: Math.max(0, 4 + baralho.dinheiroInicial + stake.dinheiroInicial),
```

E adicionar os dois campos logo após `vouchers: [],`:

```js
    baralho: baralho.id,
    stake: stake.id,
```

- [ ] **Step 6: Asserção em `tests/state.test.js`**

No teste "state: criarRun monta o estado inicial do spec", após `igual(state.vouchers, []);`, adicionar:

```js
  igual(state.baralho, "padrao");
  igual(state.stake, "branco");
```

- [ ] **Step 7: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `108 teste(s), 0 falha(s)` (103 + 5 novos). Essencial: +5 e 0 falhas.

- [ ] **Step 8: Commit**

```bash
git add js/data/baralhos.js js/data/stakes.js js/state.js tests/baralhos-stakes.test.js tests/state.test.js tests/todos.js
git commit -m "feat: dados de baralhos/stakes + criarRun com escolha + save v4 (milestone #4)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: efeitos no engine (alvo com stake, mãos/descartes do baralho)

**Files:**
- Modify: `js/engine/blinds.js`, `js/engine/run.js`
- Modify: `tests/baralhos-stakes.test.js`

Contexto: `alvoDaBlind` ganha `multStake` (default 1). `iniciarBlind` aplica os bônus do
baralho (mãos/descartes, somando aos do voucher) e o multStake do stake no alvo.

- [ ] **Step 1: Acrescentar os testes que falham a `tests/baralhos-stakes.test.js`**

Adicionar ao import do topo:

```js
import { alvoDaBlind } from "../js/engine/blinds.js";
import { iniciarBlind, MAOS_POR_BLIND, DESCARTES_POR_BLIND } from "../js/engine/run.js";
```

E acrescentar ao FIM do arquivo:

```js
teste("alvoDaBlind: multStake default 1 = atual; 1.25 escala com floor", () => {
  igual(alvoDaBlind(1, "pequena", null), 300, "default 1");
  igual(alvoDaBlind(1, "pequena", null, 1.25), 375, "300 * 1.25");
  igual(alvoDaBlind(1, "grande", null, 1.25), Math.floor(450 * 1.25), "450 * 1.25");
});

teste("iniciarBlind: baralho Vermelho dá +1 descarte; Azul +1 mão", () => {
  const verm = criarRun(1, "vermelho", "branco"); iniciarBlind(verm, "pequena");
  igual(verm.rodada.descartesRestantes, DESCARTES_POR_BLIND + 1);
  const azul = criarRun(1, "azul", "branco"); iniciarBlind(azul, "pequena");
  igual(azul.rodada.maosRestantes, MAOS_POR_BLIND + 1);
});

teste("iniciarBlind: Azul + voucher Mãos+ empilham (+2 mãos)", () => {
  const state = criarRun(1, "azul", "branco");
  state.vouchers = ["maos-mais"];
  iniciarBlind(state, "pequena");
  igual(state.rodada.maosRestantes, MAOS_POR_BLIND + 2);
});

teste("iniciarBlind: stake Vermelho escala o alvo em +25%", () => {
  const state = criarRun(1, "padrao", "vermelho");
  iniciarBlind(state, "pequena");
  igual(state.blindAtual.alvo, Math.floor(alvoDaBlind(state.ante, "pequena", null) * 1.25));
});
```

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "baralho|stake|alvo|falha"`
Esperado: falhas (alvo não escala; descartes/mãos sem bônus do baralho).

- [ ] **Step 3: `alvoDaBlind` com `multStake` (`js/engine/blinds.js`)**

Hoje:

```js
export function alvoDaBlind(ante, tipo, chefeId) {
  const base = BASES[ante - 1];
  if (tipo === "pequena") return base;
  if (tipo === "grande") return Math.floor(base * 1.5);
  return base * (CHEFES[chefeId].multAlvo || 2);
}
```

Trocar por (multStake com default 1, aplicado com floor em todos os ramos):

```js
export function alvoDaBlind(ante, tipo, chefeId, multStake = 1) {
  const base = BASES[ante - 1];
  let alvo;
  if (tipo === "pequena") alvo = base;
  else if (tipo === "grande") alvo = base * 1.5;
  else alvo = base * (CHEFES[chefeId].multAlvo || 2);
  return Math.floor(alvo * multStake);
}
```

> Nota: o ramo "grande" antes já fazia `Math.floor(base * 1.5)`; agora o floor é aplicado
> no final sobre `base * 1.5 * multStake`. Para `multStake=1`, `Math.floor(base*1.5*1)` ===
> `Math.floor(base*1.5)`, então os testes de blinds.test.js seguem idênticos.

- [ ] **Step 4: `iniciarBlind` com baralho e stake (`js/engine/run.js`)**

Adicionar imports no topo (há `import { PLANETAS } from "../data/planets.js";` e os de taros/espectrais). Acrescentar:

```js
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";
```

Em `iniciarBlind`, hoje:

```js
export function iniciarBlind(state, tipo) {
  const chefeId = tipo === "chefe" ? chefeDoAnte(state) : null;
  state.blindAtual = { tipo, chefeId, alvo: alvoDaBlind(state.ante, tipo, chefeId) };
  state.rodada = {
    baralho: embaralhar(state, criarBaralho()),
    mao: [],
    pontuacao: 0,
    maosRestantes: MAOS_POR_BLIND + (state.vouchers.includes("maos-mais") ? 1 : 0),
    descartesRestantes: DESCARTES_POR_BLIND,
    descartesUsados: 0,
    tiposJogados: [],
    ordenacao: "valor",
  };
```

Trocar por:

```js
export function iniciarBlind(state, tipo) {
  const chefeId = tipo === "chefe" ? chefeDoAnte(state) : null;
  const baralho = BARALHOS[state.baralho] || BARALHOS.padrao;
  const multStake = (STAKES[state.stake] || STAKES.branco).multAlvo;
  state.blindAtual = { tipo, chefeId, alvo: alvoDaBlind(state.ante, tipo, chefeId, multStake) };
  state.rodada = {
    baralho: embaralhar(state, criarBaralho()),
    mao: [],
    pontuacao: 0,
    maosRestantes: MAOS_POR_BLIND + (state.vouchers.includes("maos-mais") ? 1 : 0) + baralho.maosBonus,
    descartesRestantes: DESCARTES_POR_BLIND + baralho.descartesBonus,
    descartesUsados: 0,
    tiposJogados: [],
    ordenacao: "valor",
  };
```

(O resto de `iniciarBlind` — `reporMao(state)`, `state.fase = "rodada"` — fica igual.)

- [ ] **Step 5: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `112 teste(s), 0 falha(s)` (108 + 4 novos). Os testes de blinds.test.js seguem
verdes (multStake default 1).

- [ ] **Step 6: Commit**

```bash
git add js/engine/blinds.js js/engine/run.js tests/baralhos-stakes.test.js
git commit -m "feat: stake escala alvos; baralho dá mãos/descartes extras (milestone #4)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: UI — seletores no título + baralho/stake no cabeçalho

**Files:**
- Modify: `js/ui/screens.js`, `js/ui/render.js`, `css/screens.css`

Contexto: a tela de título ganha dois `<select>` (baralho/stake) com descrição da opção
escolhida; "Jogar" lê `.value` deles. O `cabecalhoRun` mostra baralho/stake durante a run.
A exibição do alvo na seleção de blind usa o multStake do stake. Mudança de UI; verificação
manual.

- [ ] **Step 1: `cabecalhoRun` mostra baralho/stake (`js/ui/render.js`)**

Importar os dados no topo de render.js. Há `import { ESPECTRAIS } from "../data/espectrais.js";` (entre outros). Acrescentar:

```js
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";
```

`cabecalhoRun` hoje termina com o botão "Mãos". Adicionar um span de baralho/stake como
último filho, após o botão "Mãos":

```js
    el("button", { classe: "botao botao-mini", onclick: () => app.mostrarTabelaMaos(state) }, "Mãos"),
    el("span", { classe: "descricao" }, `${(BARALHOS[state.baralho] || BARALHOS.padrao).nome} · ${(STAKES[state.stake] || STAKES.branco).nome}`),
  );
}
```

- [ ] **Step 2: Seletores no título (`js/ui/screens.js`)**

Importar os dados no topo de screens.js:

```js
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";
```

`renderTitulo` hoje cria `campoSeed`, a função `iniciarJogo` e o `replaceChildren`.
Substituir a função inteira por uma versão com os dois seletores e suas descrições:

```js
function renderTitulo() {
  const secao = secaoDe("titulo");
  const campoSeed = el("input", {
    id: "campo-seed", classe: "campo-seed", type: "text",
    placeholder: "Seed (opcional)", maxlength: "8",
  });

  const seletor = (classe, dados) => el("select", { classe },
    ...Object.values(dados).map((d) => el("option", { value: d.id }, d.nome)),
  );
  const selBaralho = seletor("campo-seed seletor-run", BARALHOS);
  const selStake = seletor("campo-seed seletor-run", STAKES);
  const descBaralho = el("p", { classe: "descricao" }, BARALHOS.padrao.descricao);
  const descStake = el("p", { classe: "descricao" }, STAKES.branco.descricao);
  selBaralho.addEventListener("change", () => { descBaralho.textContent = BARALHOS[selBaralho.value].descricao; });
  selStake.addEventListener("change", () => { descStake.textContent = STAKES[selStake.value].descricao; });

  function iniciarJogo() {
    const valor = campoSeed.value.trim();
    let semente;
    if (valor !== "") {
      semente = decodificarSeed(valor);
      if (semente === null) { avisar("seed-invalida"); return; }
    }
    app.state = criarRun(semente, selBaralho.value, selStake.value);
    atualizar();
  }

  secao.replaceChildren(
    el("h1", { classe: "logo" }, "BalatroJS"),
    el("p", { classe: "subtitulo" }, "um clone de estudo em JavaScript puro"),
    campoSeed,
    el("label", { classe: "rotulo-seletor" }, "Baralho"), selBaralho, descBaralho,
    el("label", { classe: "rotulo-seletor" }, "Stake"), selStake, descStake,
    el("button", { classe: "botao botao-azul", onclick: iniciarJogo }, "Jogar"),
  );
  const save = carregar();
  if (save) {
    secao.append(el("button", { classe: "botao", onclick: () => { app.state = save; atualizar(); } }, "Continuar"));
  }
}
```

> Nota sobre `criarRun(semente, ...)`: quando o campo de seed está vazio, `semente` fica
> `undefined`, e `criarRun(undefined, baralho, stake)` usa o default `Date.now() % 2**31`
> (parâmetro default só dispara com `undefined`) — comportamento idêntico ao atual.

- [ ] **Step 3: Alvo na seleção de blind usa o stake (`js/ui/screens.js`)**

Em `cartaoBlind` (perto da linha que mostra o alvo), hoje:

```js
    el("p", {}, "Alvo: ", el("span", { classe: "numero" }, alvoDaBlind(state.ante, tipo, chefeId).toLocaleString("pt-BR"))),
```

Trocar por (passa o multStake do stake — importar STAKES já feito no Step 2):

```js
    el("p", {}, "Alvo: ", el("span", { classe: "numero" }, alvoDaBlind(state.ante, tipo, chefeId, (STAKES[state.stake] || STAKES.branco).multAlvo).toLocaleString("pt-BR"))),
```

- [ ] **Step 4: CSS dos seletores (`css/screens.css`, ao FIM)**

```css
.seletor-run { cursor: pointer; }
.rotulo-seletor { display: block; margin: 0.6rem 0 0.2rem; font-weight: 600; }
```

- [ ] **Step 5: Rodar a suíte**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `112 teste(s), 0 falha(s)` (mudança de UI; testes não exercitam).

- [ ] **Step 6: Smoke headless (módulos carregam)**

```bash
node --input-type=module -e '
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ className:"", value:"", textContent:"", setAttribute(){}, append(){}, addEventListener(){}, classList:{add(){},remove(){}}, style:{}, dataset:{} }), createElementNS: () => ({ tagName:"svg", setAttribute(){}, append(){} }), body:{ append(){} } };
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const s = await import("./js/ui/screens.js");
const r = await import("./js/ui/render.js");
if (typeof s.mostrarTela !== "function" || typeof r.cabecalhoRun !== "function") { console.error("export ausente"); process.exit(1); }
console.log("OK screens.js/render.js carregam com baralhos/stakes");
'
```
Esperado: `OK screens.js/render.js carregam com baralhos/stakes`.

- [ ] **Step 7: Verificação manual (anotar, não bloqueia)**

Servir e confirmar: seletores de baralho/stake no título com descrição que muda; "Jogar"
cria a run escolhida; alvos +25% com stake Vermelho/Dourado; +1 descarte (Vermelho),
+1 mão (Azul), +$10 (Amarelo), −$1 (Dourado); baralho/stake no cabeçalho. Sem browser →
pendência visual.

- [ ] **Step 8: Commit**

```bash
git add js/ui/screens.js js/ui/render.js css/screens.css
git commit -m "feat: UI de baralhos/stakes (seletores no título, cabeçalho) (milestone #4)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `112 teste(s), 0 falha(s)`.

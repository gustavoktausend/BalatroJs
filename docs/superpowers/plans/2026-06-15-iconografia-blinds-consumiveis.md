# Iconografia de blinds e consumíveis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a cada blind (pequena/grande/chefe) e a cada consumível (9 planetas, 6 tarôs, 3 espectrais) um ícone de glifo Unicode temático, exibido junto do nome.

**Architecture:** Campo `icone` nos objetos de dados (`planets.js`/`taros.js`/`espectrais.js`) é a fonte de verdade dos consumíveis; um mapa `ICONE_BLIND` na UI cobre os 3 blinds. A UI lê esses glifos em dois funis: `elementoConsumivel` (todos os consumíveis) e os dois pontos de blind (`cartaoBlind`, `painelLateral`). Engine e save intocados — `icone` é só apresentação.

**Tech Stack:** JS ES modules nativos (helper `el()` de `render.js`), CSS3, sem build, zero deps. Harness `node tests/todos.js` (Node 18+; `teste/ok/igual` em `tests/harness.js`).

**Spec:** `docs/superpowers/specs/2026-06-15-iconografia-blinds-consumiveis-design.md`

---

## File Structure

- **Modify (dados):** `js/data/planets.js`, `js/data/taros.js`, `js/data/espectrais.js` — adicionar `icone` a cada item.
- **Modify (teste):** `tests/data.test.js` — um teste novo: todo consumível tem `icone` (string não vazia).
- **Modify (UI consumível):** `js/ui/render.js` — `elementoConsumivel` emite o glifo central.
- **Modify (UI blind):** `js/ui/screens.js` — mapa `ICONE_BLIND`; glifo em `cartaoBlind` e em `painelLateral`.
- **Modify (CSS):** `css/cards.css` — `.icone-consumivel` + ajustar `.consumivel` para layout coluna (glifo no centro, nome embaixo). `css/screens.css` — `.icone-blind`.

Ordem: Task 1 (dados + teste — TDD) → Task 2 (UI+CSS consumível) → Task 3 (UI+CSS blind + validação visual).

---

## Task 1: Campo `icone` nos dados dos consumíveis + teste (TDD)

**Files:**
- Modify: `js/data/planets.js`, `js/data/taros.js`, `js/data/espectrais.js`
- Test: `tests/data.test.js`

- [ ] **Step 1: Confirmar baseline verde**

Run: `node tests/todos.js`
Expected: última linha `112 teste(s), 0 falha(s)`

- [ ] **Step 2: Escrever o teste que falha**

Em `tests/data.test.js`, no TOPO, ampliar os imports existentes para incluir TAROS e ESPECTRAIS. A linha 2 atual é:
```js
import { PLANETAS, PRECO_PLANETA } from "../js/data/planets.js";
```
Adicionar LOGO APÓS ela estas duas linhas:
```js
import { TAROS } from "../js/data/taros.js";
import { ESPECTRAIS } from "../js/data/espectrais.js";
```
Depois, adicionar ao FINAL do arquivo este teste:
```js
teste("consumiveis: todo planeta/tarô/espectral tem ícone (glifo não vazio)", () => {
  // PLANETAS/TAROS/ESPECTRAIS são todos mapas id→def (taros/espectrais via
  // Object.fromEntries(LISTA…)). Iteramos Object.values uniformemente.
  const grupos = { planeta: PLANETAS, taro: TAROS, espectral: ESPECTRAIS };
  for (const [tipo, mapa] of Object.entries(grupos)) {
    for (const def of Object.values(mapa)) {
      ok(typeof def.icone === "string" && def.icone.length > 0,
        `${tipo} sem ícone: ${def.nome}`);
    }
  }
});
```

- [ ] **Step 3: Rodar o teste e confirmar que FALHA**

Run: `node tests/todos.js`
Expected: FALHA — última linha `113 teste(s), 1 falha(s)`, com `✘ consumiveis: todo planeta/tarô/espectral tem ícone` e mensagem tipo `planeta sem ícone: Plutão` (os dados ainda não têm `icone`).

- [ ] **Step 4: Adicionar `icone` aos 9 planetas**

Em `js/data/planets.js`, substituir o objeto `PLANETAS` inteiro (linhas 3-13) por:
```js
export const PLANETAS = {
  plutao:   { nome: "Plutão",   mao: "carta-alta",          icone: "♇" },
  mercurio: { nome: "Mercúrio", mao: "par",                 icone: "☿" },
  urano:    { nome: "Urano",    mao: "dois-pares",          icone: "♅" },
  venus:    { nome: "Vênus",    mao: "trinca",              icone: "♀" },
  saturno:  { nome: "Saturno",  mao: "sequencia",           icone: "♄" },
  jupiter:  { nome: "Júpiter",  mao: "flush",               icone: "♃" },
  terra:    { nome: "Terra",    mao: "full-house",          icone: "⊕" },
  marte:    { nome: "Marte",    mao: "quadra",              icone: "♂" },
  netuno:   { nome: "Netuno",   mao: "sequencia-de-naipe",  icone: "♆" },
};
```

- [ ] **Step 5: Adicionar `icone` aos 6 tarôs**

Em `js/data/taros.js`, dentro da `LISTA`, adicionar `icone:` a cada objeto. Substituir cada cabeçalho de item assim (mude SÓ a primeira linha de cada objeto, mantendo `aplicar` intacto):

- `o-mundo`: a linha `  { id: "o-mundo", nome: "O Mundo", descricao: "Ganha $20.",` vira
```js
  { id: "o-mundo", nome: "O Mundo", icone: "✷", descricao: "Ganha $20.",
```
- `a-estrela`: `  { id: "a-estrela", nome: "A Estrela", descricao: "Sobe 1 nível de uma mão aleatória.",` vira
```js
  { id: "a-estrela", nome: "A Estrela", icone: "★", descricao: "Sobe 1 nível de uma mão aleatória.",
```
- `a-lua`: `  { id: "a-lua", nome: "A Lua", descricao: "Cria 1 Planeta aleatório.",` vira
```js
  { id: "a-lua", nome: "A Lua", icone: "☾", descricao: "Cria 1 Planeta aleatório.",
```
- `o-diabo`: `  { id: "o-diabo", nome: "O Diabo", descricao: "Cria 1 Coringa comum.",` vira
```js
  { id: "o-diabo", nome: "O Diabo", icone: "⛧", descricao: "Cria 1 Coringa comum.",
```
- `a-roda`: `  { id: "a-roda", nome: "A Roda da Fortuna", descricao: "Chance de criar um Coringa incomum; senão +$5.",` vira
```js
  { id: "a-roda", nome: "A Roda da Fortuna", icone: "☸", descricao: "Chance de criar um Coringa incomum; senão +$5.",
```
- `a-temperanca`: `  { id: "a-temperanca", nome: "A Temperança", descricao: "Ganha o valor de venda dos seus Coringas (máx. $20).",` vira
```js
  { id: "a-temperanca", nome: "A Temperança", icone: "⚖", descricao: "Ganha o valor de venda dos seus Coringas (máx. $20).",
```

- [ ] **Step 6: Adicionar `icone` aos 3 espectrais**

Em `js/data/espectrais.js`, dentro da `LISTA`:
- `aether`: `  { id: "aether", nome: "Aether", descricao: "Sobe 2 níveis de uma mão aleatória.",` vira
```js
  { id: "aether", nome: "Aether", icone: "✦", descricao: "Sobe 2 níveis de uma mão aleatória.",
```
- `seance`: `  { id: "seance", nome: "Séance", descricao: "Cria 1 Coringa raro.",` vira
```js
  { id: "seance", nome: "Séance", icone: "❂", descricao: "Cria 1 Coringa raro.",
```
- `wraith`: `  { id: "wraith", nome: "Wraith", descricao: "Cria 1 Coringa raro, mas zera seu dinheiro.",` vira
```js
  { id: "wraith", nome: "Wraith", icone: "☄", descricao: "Cria 1 Coringa raro, mas zera seu dinheiro.",
```

- [ ] **Step 7: Rodar o teste e confirmar que PASSA**

Run: `node tests/todos.js`
Expected: última linha `113 teste(s), 0 falha(s)` (o novo teste verde).

- [ ] **Step 8: Commit**

```bash
git add js/data/planets.js js/data/taros.js js/data/espectrais.js tests/data.test.js
git commit -m "feat: campo icone nos dados de planetas, tarôs e espectrais (+teste)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Glifo central nos consumíveis (UI + CSS)

**Files:**
- Modify: `js/ui/render.js` (`elementoConsumivel` ~138-160)
- Modify: `css/cards.css` (`.consumivel` ~88-94)
- Verify: `tests/todos.js`

- [ ] **Step 1: Emitir o glifo em `elementoConsumivel`**

Em `js/ui/render.js`, a função `elementoConsumivel` hoje resolve `nome`/`descricaoHtml` e cria o elemento assim (linhas ~138-152):
```js
export function elementoConsumivel(consumivel, indice = null) {
  const { tipo, id } = consumivel;
  let nome, descricaoHtml;
  if (tipo === "planeta") {
    const planeta = PLANETAS[id];
    const nivel = app.state ? app.state.niveisMaos[planeta.mao] : 1;
    nome = planeta.nome;
    descricaoHtml = `Sobe o nível de ${MAOS[planeta.mao].nome} (nível atual: ${nivel})`;
  } else {
    const def = tipo === "taro" ? TAROS[id] : ESPECTRAIS[id];
    nome = def.nome;
    descricaoHtml = def.descricao;
  }
  const elemento = el("div", { classe: `consumivel consumivel--${tipo}` }, el("span", {}, nome));
```
Precisamos do `icone` também. Como cada ramo já acessa o `def`/`planeta`, capture o ícone em uma variável `icone`. Substituir o bloco acima (da assinatura até a linha do `const elemento = ...`) por:
```js
export function elementoConsumivel(consumivel, indice = null) {
  const { tipo, id } = consumivel;
  let nome, descricaoHtml, icone;
  if (tipo === "planeta") {
    const planeta = PLANETAS[id];
    const nivel = app.state ? app.state.niveisMaos[planeta.mao] : 1;
    nome = planeta.nome;
    icone = planeta.icone;
    descricaoHtml = `Sobe o nível de ${MAOS[planeta.mao].nome} (nível atual: ${nivel})`;
  } else {
    const def = tipo === "taro" ? TAROS[id] : ESPECTRAIS[id];
    nome = def.nome;
    icone = def.icone;
    descricaoHtml = def.descricao;
  }
  const elemento = el("div", { classe: `consumivel consumivel--${tipo}` },
    el("span", { classe: "icone-consumivel", "aria-hidden": "true" }, icone),
    el("span", { classe: "nome" }, nome),
  );
```
(O `<span>` do nome ganhou `classe: "nome"` para o CSS, espelhando o que `.coringa .nome` já faz. O glifo vem antes, com `aria-hidden`.)

- [ ] **Step 2: Estilo do glifo + layout coluna no `.consumivel` (CSS)**

Em `css/cards.css`, a regra `.consumivel` (linhas 88-91) é:
```css
.consumivel {
  background: linear-gradient(160deg, #1d4a6b, #102a3e);
  border: 2px solid #3e7ca6;
}
```
Substituir por (adiciona layout coluna como o `.coringa`, e o estilo do glifo):
```css
.consumivel {
  background: linear-gradient(160deg, #1d4a6b, #102a3e);
  border: 2px solid #3e7ca6;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
.consumivel .nome { width: 100%; }
.icone-consumivel {
  font-size: 2.6rem;
  line-height: 1;
  margin-top: 6px;
  color: var(--texto);
  pointer-events: none;
}
.consumivel--planeta .icone-consumivel { color: var(--azul); }
.consumivel--taro .icone-consumivel { color: #b072d6; }
.consumivel--espectral .icone-consumivel { color: #6fe0ff; }
```
(As cores espelham as `border-color` por tipo já existentes nas linhas 92-94. O `.consumivel` base já tem `display:flex; align-items:flex-end; justify-content:center` herdado do seletor agrupado `.coringa, .consumivel` no topo do arquivo — ao redefinir `align-items/justify-content/flex-direction` aqui, o glifo sobe ao centro/topo e o nome desce, igual ao coringa.)

- [ ] **Step 3: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `113 teste(s), 0 falha(s)`

- [ ] **Step 4: Commit**

```bash
git add js/ui/render.js css/cards.css
git commit -m "feat: glifo central nos consumíveis (planeta/tarô/espectral)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Glifo nos blinds + validação (UI + CSS)

**Files:**
- Modify: `js/ui/screens.js` (`NOME_BLIND` ~76; `cartaoBlind` ~94; `painelLateral` ~139-143)
- Modify: `css/screens.css` (regra nova `.icone-blind`)
- Verify: `tests/todos.js`

- [ ] **Step 1: Adicionar o mapa `ICONE_BLIND`**

Em `js/ui/screens.js`, a linha 76 é:
```js
const NOME_BLIND = { pequena: "Aposta Pequena", grande: "Aposta Grande" };
```
Adicionar LOGO APÓS ela:
```js
const ICONE_BLIND = { pequena: "●", grande: "◆", chefe: "☠" };
```

- [ ] **Step 2: Glifo no `cartaoBlind` (tela de seleção)**

Em `cartaoBlind`, a linha 94 (o `<h3>` do nome) é:
```js
    el("h3", {}, tipo === "chefe" ? CHEFES[chefeId].nome : NOME_BLIND[tipo]),
```
Substituir por:
```js
    el("h3", {},
      el("span", { classe: "icone-blind", "aria-hidden": "true" }, ICONE_BLIND[tipo]),
      " ",
      tipo === "chefe" ? CHEFES[chefeId].nome : NOME_BLIND[tipo],
    ),
```

- [ ] **Step 3: Glifo no `painelLateral` (cartucho da lateral, na rodada)**

Em `painelLateral`, o cartucho do blind é (linhas ~139-143):
```js
  const titulo = blind.tipo === "chefe" ? CHEFES[blind.chefeId].nome : NOME_BLIND[blind.tipo];
  return [
    el("div", { classe: "cartucho cartucho-blind" + (blind.tipo === "chefe" ? " chefe" : "") },
      el("h3", {}, titulo),
    ),
```
Substituir o `el("h3", {}, titulo),` por:
```js
      el("h3", {},
        el("span", { classe: "icone-blind", "aria-hidden": "true" }, ICONE_BLIND[blind.tipo]),
        " ",
        titulo,
      ),
```
(A linha do `const titulo = ...` permanece inalterada acima.)

- [ ] **Step 4: Estilo `.icone-blind` (CSS)**

Em `css/screens.css`, localizar a regra existente:
```css
.cartucho-blind.chefe h3 { color: var(--vermelho); }
```
Inserir LOGO APÓS ela:
```css
.icone-blind { font-size: 0.9em; opacity: 0.9; }
```
(Glifo inline no `<h3>`, levemente menor que o texto. A cor herda do `<h3>` — chefe fica vermelho automaticamente pelas regras `.cartao-blind.chefe h3`/`.cartucho-blind.chefe h3` já existentes.)

- [ ] **Step 5: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `113 teste(s), 0 falha(s)`

- [ ] **Step 6: Validar no navegador**

Servir (`python3 -m http.server 8123` na raiz) e abrir `http://localhost:8123/index.html`.
- Iniciar um jogo → tela de seleção de blind: confirmar `●` antes de "Aposta Pequena", `◆` antes de "Aposta Grande", `☠` antes do nome do chefe (chefe em vermelho).
- Entrar numa rodada → o cartucho da lateral mostra o glifo do blind atual antes do nome.
- Ir à loja (ou abrir um pacote celestial/arcano) → consumíveis com glifo central: planetas (♇☿♀♂♃♄♅♆⊕), tarôs (✷★☾⛧☸⚖), espectrais (✦❂☄).
- **CRÍTICO:** confirmar via screenshot que NENHUM glifo aparece como "□" (tofu). Se algum cair em tofu, registrar qual e trocar por equivalente legível (ex.: ⛧→✦, ☸→✸, ❂→✶, ☄→✦) no dado correspondente e re-testar.
- Conferir desktop e mobile (o glifo do consumível escala com a caixa).
Se não houver browser, registrar pendência visual.

- [ ] **Step 7: Commit**

```bash
git add js/ui/screens.js css/screens.css
git commit -m "feat: glifo nos blinds (seleção + lateral da rodada)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificação final (após as 3 tasks)

- [ ] **Suíte verde:** `node tests/todos.js` → `113 teste(s), 0 falha(s)`.
- [ ] **Consumíveis:** glifo central por tipo (planeta azul / tarô roxo / espectral ciano) na fileira de consumíveis, na loja e nos pacotes.
- [ ] **Blinds:** ● pequena, ◆ grande, ☠ chefe — na seleção e no cartucho da lateral; chefe em vermelho.
- [ ] **Sem tofu:** nenhum glifo renderiza como "□" na fonte self-hospedada.
- [ ] **Merge:** branch de feature, merge `--no-ff` em `main`, apagar a branch, push (o usuário acompanha pelo deploy).

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Campo `icone` em planetas/tarôs/espectrais: Task 1 Steps 4-6. ✓
- Mapa `ICONE_BLIND` na UI (3 blinds): Task 3 Step 1. ✓
- Glifo central no consumível (`elementoConsumivel`, único funil): Task 2 Step 1. ✓
- Glifo no blind na seleção e na lateral: Task 3 Steps 2-3. ✓
- `aria-hidden` nos glifos decorativos: Task 2 Step 1 e Task 3 Steps 2-3. ✓
- Cores por tipo (planeta/tarô/espectral) e chefe vermelho: Task 2 Step 2 + Task 3 Step 4. ✓
- Responsivo (glifo escala com a caixa via rem + breakpoints existentes): Task 2 Step 2 (font-size em rem; `.consumivel` já tem @media). ✓
- Teste de dados garantindo `icone` (112→113): Task 1 Steps 2-7. ✓
- Validação navegador, incluindo checagem de tofu: Task 3 Step 6 + final. ✓

**Placeholders:** nenhum — todos os 18 glifos e todo JS/CSS escritos por extenso, com trechos a localizar copiados dos arquivos reais.

**Consistência:** `ICONE_BLIND` usado em Task 3 Steps 2 e 3; classe `.icone-consumivel` (Task 2 Step 1) estilizada em Task 2 Step 2; `.icone-blind` (Task 3 Steps 2-3) estilizada em Task 3 Step 4; `.nome` no consumível espelha `.coringa .nome` existente. O teste itera `Object.values` dos três mapas (planets/taros/espectrais são todos objeto id→def). Trailer `Claude Opus 4.8`. Trechos confirmados por leitura (planets.js 1-13, taros.js 16-47, espectrais.js 7-24, render.js 138-160, screens.js 76/90-105/136-143, cards.css 88-111, screens.css regras de blind; harness `teste/ok/igual`).

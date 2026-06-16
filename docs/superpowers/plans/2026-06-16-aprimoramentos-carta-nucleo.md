# Aprimoramentos de carta — Sub-etapa A (núcleo) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o núcleo do sistema de aprimoramentos de carta do Balatro — os 8 aprimoramentos (bonus/mult/wild/vidro/aco/ouro/pedra/sorte) funcionando no engine de pontuação e detecção de mão, com baralho-mestre da run persistente e um tarô ("O Mago") como prova viva.

**Architecture:** Cada carta ganha um campo `aprimoramento` (null por padrão). Um baralho-mestre `state.baralhoRun` persiste entre blinds; cada blind embaralha uma cópia. Os efeitos entram no pipeline de `scoring.js` (chips/mult/xmult, aço varrendo a mão, sorte/vidro com RNG) e na detecção de `poker.js` (wild = naipe coringa; pedra fora da detecção mas sempre pontua). Vidro que quebra é removido do `baralhoRun` em `run.js`.

**Tech Stack:** JavaScript ES modules, zero dependências, sem build. Testes via harness próprio (`tests/harness.js` → `teste/ok/igual`, roda em `node tests/todos.js`). Convenções: PT-BR em código/comentários; trailer de commit `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-16-aprimoramentos-carta-nucleo-design.md`

---

## Estrutura de arquivos

- **Cria** `js/data/aprimoramentos.js` — definições dos 8 aprimoramentos (`nome`, `descricao` PT-BR). Único lugar dos metadados; consultado por scoring/poker e pelo teste de dados.
- **Cria** `tests/aprimoramentos.test.js` — testes de dados (anti-vácuo) + pontuação dos aprimoramentos.
- **Modifica** `js/engine/deck.js` — shape `{id,naipe,valor,aprimoramento:null}`; helper `copiarBaralho`; helper `ehPedra`.
- **Modifica** `js/engine/poker.js` — wild no flush/seq-de-naipe; pedra fora da detecção, sempre em `cartasQuePontuam`.
- **Modifica** `js/engine/scoring.js` — efeitos de aprimoramento por carta + aço na mão; devolve `cartasDestruidas` e `dinheiroSorte`.
- **Modifica** `js/engine/run.js` — baralho da rodada a partir de `state.baralhoRun`; destruição de vidro; ouro no fim da rodada; crédito do dinheiro de sorte.
- **Modifica** `js/state.js` — `baralhoRun` em `criarRun`/`salvar`; `VERSAO_SAVE → 5`.
- **Modifica** `js/data/taros.js` — tarô "O Mago".
- **Modifica** `tests/poker.test.js` e `tests/run.test.js` — testes de wild/pedra e de destruição/ouro/O Mago.

**Ordem das tasks** (cada uma compila e mantém `node tests/todos.js` verde):
1. Dados dos aprimoramentos + teste de dados
2. Shape da carta + `copiarBaralho`/`ehPedra` (regressão)
3. `poker.js`: pedra
4. `poker.js`: wild
5. `scoring.js`: efeitos diretos (bonus/mult/pedra)
6. `scoring.js`: aço (mão)
7. `scoring.js`: vidro (xmult + destruição) — devolve `cartasDestruidas`
8. `scoring.js`: sorte (RNG) — devolve `dinheiroSorte`
9. `state.js` + `run.js`: baralho-mestre da run
10. `run.js`: destruição de vidro + crédito de sorte
11. `run.js`: ouro no fim da rodada
12. `taros.js`: "O Mago" (prova viva)

---

### Task 1: Dados dos 8 aprimoramentos + teste anti-vácuo

**Files:**
- Create: `js/data/aprimoramentos.js`
- Create: `tests/aprimoramentos.test.js`
- Modify: `tests/todos.js` (registrar o novo arquivo de teste)

- [ ] **Step 1: Escrever o teste de dados (falha)**

Criar `tests/aprimoramentos.test.js`:

```javascript
import { teste, ok } from "./harness.js";
import { APRIMORAMENTOS, IDS_APRIMORAMENTO } from "../js/data/aprimoramentos.js";

teste("aprimoramentos: 8 ids esperados", () => {
  ok(IDS_APRIMORAMENTO.length === 8, `esperava 8, veio ${IDS_APRIMORAMENTO.length}`);
  for (const id of ["bonus", "mult", "wild", "vidro", "aco", "ouro", "pedra", "sorte"]) {
    ok(IDS_APRIMORAMENTO.includes(id), `falta o id ${id}`);
  }
});

teste("aprimoramentos: cada um tem nome e descricao PT-BR não-vazios", () => {
  for (const id of IDS_APRIMORAMENTO) {
    const a = APRIMORAMENTOS[id];
    ok(a && a.nome && a.nome.trim().length > 0, `${id} sem nome`);
    ok(a.descricao && a.descricao.trim().length > 0, `${id} sem descricao`);
  }
});
```

- [ ] **Step 2: Registrar o teste em `tests/todos.js`**

Abrir `tests/todos.js` e adicionar a linha de import junto das outras (segue o padrão dos imports existentes de `*.test.js`):

```javascript
import "./aprimoramentos.test.js";
```

- [ ] **Step 3: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — erro de módulo não encontrado / `APRIMORAMENTOS` indefinido.

- [ ] **Step 4: Implementar `js/data/aprimoramentos.js`**

```javascript
// Definições dos aprimoramentos de carta (Balatro). Metadados puros: os EFEITOS
// vivem em scoring.js/poker.js; aqui ficam só id, nome e descrição (PT-BR).
// Uma carta tem no máximo um aprimoramento (campo `aprimoramento`, null = nenhum).
const LISTA = [
  { id: "bonus", nome: "Bônus",   descricao: "+30 fichas quando pontua." },
  { id: "mult",  nome: "Mult",    descricao: "+4 mult quando pontua." },
  { id: "wild",  nome: "Selvagem", descricao: "Conta como qualquer naipe." },
  { id: "vidro", nome: "Vidro",   descricao: "×2 mult; 1 em 4 de se destruir ao pontuar." },
  { id: "aco",   nome: "Aço",     descricao: "×1,5 mult enquanto estiver na mão." },
  { id: "ouro",  nome: "Ouro",    descricao: "+$3 se ficar na mão no fim da rodada." },
  { id: "pedra", nome: "Pedra",   descricao: "+50 fichas; sempre pontua; sem naipe ou valor." },
  { id: "sorte", nome: "Sorte",   descricao: "1 em 5 de +20 mult; 1 em 15 de +$20 ao pontuar." },
];

export const APRIMORAMENTOS = Object.fromEntries(LISTA.map((a) => [a.id, a]));
export const IDS_APRIMORAMENTO = LISTA.map((a) => a.id);
```

- [ ] **Step 5: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — os 2 testes novos verdes; os 113 anteriores continuam verdes.

- [ ] **Step 6: Commit**

```bash
git add js/data/aprimoramentos.js tests/aprimoramentos.test.js tests/todos.js
git commit -m "feat(aprimoramentos): dados dos 8 aprimoramentos + teste anti-vácuo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Shape da carta + helpers `copiarBaralho`/`ehPedra`

**Files:**
- Modify: `js/engine/deck.js`
- Test: `tests/deck.test.js`

- [ ] **Step 1: Escrever os testes (falham)**

Em `tests/deck.test.js`, **alterar o import existente** para incluir os helpers novos (o import atual é `import { criarBaralho, chipsDaCarta, rotuloDaCarta, ehFigura, NAIPES } from "../js/engine/deck.js";`):

```javascript
import { criarBaralho, chipsDaCarta, rotuloDaCarta, ehFigura, NAIPES, copiarBaralho, ehPedra } from "../js/engine/deck.js";
```

Depois adicionar os testes:

```javascript
teste("deck: toda carta nasce com aprimoramento null", () => {
  const b = criarBaralho();
  ok(b.length === 52);
  ok(b.every((c) => c.aprimoramento === null), "alguma carta sem campo aprimoramento:null");
});

teste("deck: copiarBaralho clona as cartas (cópia rasa por carta)", () => {
  const mestre = criarBaralho();
  mestre[0].aprimoramento = "mult";
  const copia = copiarBaralho(mestre);
  copia[0].aprimoramento = "bonus";
  igual(mestre[0].aprimoramento, "mult", "mutar a cópia não pode afetar o mestre");
  igual(copia.length, 52);
});

teste("deck: ehPedra reconhece só a carta de pedra", () => {
  ok(ehPedra({ naipe: "copas", valor: 9, aprimoramento: "pedra" }));
  ok(!ehPedra({ naipe: "copas", valor: 9, aprimoramento: null }));
  ok(!ehPedra({ naipe: "copas", valor: 9, aprimoramento: "wild" }));
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `copiarBaralho`/`ehPedra` indefinidos e/ou `aprimoramento` ausente.

- [ ] **Step 3: Implementar em `js/engine/deck.js`**

Trocar a criação da carta e acrescentar os helpers:

```javascript
// Em criarBaralho(), a linha do push passa a incluir aprimoramento:
baralho.push({ id: `${naipe}-${valor}`, naipe, valor, aprimoramento: null });
```

Acrescentar ao fim do arquivo:

```javascript
// Cópia rasa por carta — usada para tirar o baralho da rodada do baralho-mestre
// da run sem que mutações da rodada (ex.: ordenação) vazem para o mestre.
export function copiarBaralho(baralho) {
  return baralho.map((c) => ({ ...c }));
}

export function ehPedra(carta) {
  return carta.aprimoramento === "pedra";
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — testes novos verdes; regressão verde (cartas existentes nos testes que não passam por `criarBaralho` continuam funcionando porque `aprimoramento` ausente é tratado como falsy/`undefined` no resto do código, igual a `null`).

- [ ] **Step 5: Commit**

```bash
git add js/engine/deck.js tests/deck.test.js
git commit -m "feat(aprimoramentos): campo aprimoramento na carta + copiarBaralho/ehPedra

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `poker.js` — pedra (fora da detecção, sempre pontua)

**Files:**
- Modify: `js/engine/poker.js`
- Test: `tests/poker.test.js`

**Contexto:** `detectarMao(cartas)` (atual) usa `cartas` para grupos por valor, flush (`every` mesmo naipe) e sequência. Pedra não tem rank/naipe efetivos. Estratégia: separar `pedras = cartas.filter(ehPedra)` e `jogaveis = cartas.filter((c) => !ehPedra(c))`, detectar a mão sobre `jogaveis`, e **anexar** as pedras a `cartasQuePontuam`. Caso só-de-pedras: `jogaveis` vazio → `carta-alta` sem carta de rank, só as pedras pontuam.

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/poker.test.js` (acrescentar `ehPedra` ao import de deck se necessário; criar helper local de pedra):

```javascript
const pedra = (naipe, valor) => ({ id: `p-${naipe}-${valor}-${Math.random()}`, naipe, valor, aprimoramento: "pedra" });

teste("poker: pedra não entra na detecção por rank, mas pontua", () => {
  // par de 9 + uma pedra: continua sendo "par", e a pedra entra em cartasQuePontuam
  const m = detectarMao([carta("copas", 9), carta("ouros", 9), pedra("paus", 2)]);
  igual(m.tipo, "par");
  ok(m.cartasQuePontuam.some((c) => c.aprimoramento === "pedra"), "pedra deve pontuar");
  ok(m.cartasQuePontuam.filter((c) => c.aprimoramento !== "pedra").length === 2, "os dois 9 pontuam");
});

teste("poker: pedra não conta como naipe no flush", () => {
  // 4 copas + 1 pedra de paus não formam flush (flush exige 5 reais do mesmo naipe)
  const m = detectarMao([
    carta("copas", 2), carta("copas", 5), carta("copas", 7), carta("copas", 9),
    pedra("paus", 11),
  ]);
  ok(m.tipo !== "flush", `não deveria ser flush, veio ${m.tipo}`);
});

teste("poker: jogada só de pedras é carta-alta e todas pontuam", () => {
  const m = detectarMao([pedra("copas", 2), pedra("ouros", 3)]);
  igual(m.tipo, "carta-alta");
  igual(m.cartasQuePontuam.length, 2, "as duas pedras pontuam");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — hoje a pedra entra como carta normal (par viraria detecção diferente / flush poderia formar / cartasQuePontuam errado).

- [ ] **Step 3: Implementar em `js/engine/poker.js`**

Substituir a função `detectarMao` para separar pedras antes de detectar e anexá-las depois:

```javascript
import { ehPedra } from "./deck.js";

// Detecta a melhor mão de pôquer entre 1 a 5 cartas selecionadas.
// Pedras (aprimoramento "pedra") ficam fora da detecção por rank/naipe, mas
// SEMPRE pontuam: são anexadas a cartasQuePontuam ao final.
export function detectarMao(cartas) {
  const pedras = cartas.filter(ehPedra);
  const jogaveis = cartas.filter((c) => !ehPedra(c));
  const mao = detectarEntreJogaveis(jogaveis);
  return { ...mao, cartasQuePontuam: [...mao.cartasQuePontuam, ...pedras] };
}

function detectarEntreJogaveis(cartas) {
  if (cartas.length === 0) {
    return { tipo: "carta-alta", real: false, cartasQuePontuam: [] };
  }
  const contagem = new Map();
  for (const c of cartas) contagem.set(c.valor, (contagem.get(c.valor) || 0) + 1);
  const grupos = [...contagem.entries()]
    .map(([valor, qtd]) => ({ valor, qtd }))
    .sort((a, b) => b.qtd - a.qtd || b.valor - a.valor);

  const flush = cartas.length === 5 && cartas.every((c) => c.naipe === cartas[0].naipe);
  const sequencia = ehSequencia(cartas);
  const dosGrupos = (n) => {
    const valores = new Set(grupos.slice(0, n).map((g) => g.valor));
    return cartas.filter((c) => valores.has(c.valor));
  };

  if (flush && sequencia) {
    return { tipo: "sequencia-de-naipe", real: cartas.every((c) => c.valor >= 10), cartasQuePontuam: [...cartas] };
  }
  if (grupos[0].qtd === 4) return { tipo: "quadra", real: false, cartasQuePontuam: dosGrupos(1) };
  if (grupos[0].qtd === 3 && grupos[1]?.qtd === 2) return { tipo: "full-house", real: false, cartasQuePontuam: [...cartas] };
  if (flush) return { tipo: "flush", real: false, cartasQuePontuam: [...cartas] };
  if (sequencia) return { tipo: "sequencia", real: false, cartasQuePontuam: [...cartas] };
  if (grupos[0].qtd === 3) return { tipo: "trinca", real: false, cartasQuePontuam: dosGrupos(1) };
  if (grupos[0].qtd === 2 && grupos[1]?.qtd === 2) return { tipo: "dois-pares", real: false, cartasQuePontuam: dosGrupos(2) };
  if (grupos[0].qtd === 2) return { tipo: "par", real: false, cartasQuePontuam: dosGrupos(1) };

  const maisAlta = [...cartas].sort((a, b) => b.valor - a.valor)[0];
  return { tipo: "carta-alta", real: false, cartasQuePontuam: [maisAlta] };
}
```

Manter `ehSequencia` como está (ela já recebe só `jogaveis`).

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — testes de pedra verdes; os testes existentes de `poker`/`scoring` (cartas sem pedra → `pedras` vazio, `jogaveis` = todas) idênticos ao comportamento anterior.

- [ ] **Step 5: Commit**

```bash
git add js/engine/poker.js tests/poker.test.js
git commit -m "feat(aprimoramentos): pedra fora da detecção de mão mas sempre pontua

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `poker.js` — wild (conta como qualquer naipe)

**Files:**
- Modify: `js/engine/poker.js`
- Test: `tests/poker.test.js`

**Contexto:** Wild afeta só naipe (flush e sequência-de-naipe). Rank inalterado. A checagem de flush atual é `cartas.every((c) => c.naipe === cartas[0].naipe)`. Nova regra: existe um naipe `n` tal que toda carta é do naipe `n` **ou** é wild.

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/poker.test.js`:

```javascript
const wild = (naipe, valor) => ({ id: `w-${naipe}-${valor}-${Math.random()}`, naipe, valor, aprimoramento: "wild" });

teste("poker: wild fecha um flush (4 copas + 1 wild de outro naipe)", () => {
  const m = detectarMao([
    carta("copas", 2), carta("copas", 5), carta("copas", 7), carta("copas", 9),
    wild("paus", 11),
  ]);
  igual(m.tipo, "flush");
});

teste("poker: wild não muda o rank (par continua par, não trinca)", () => {
  const m = detectarMao([carta("copas", 9), carta("ouros", 9), wild("paus", 11)]);
  igual(m.tipo, "par");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — o primeiro teste vem como `carta-alta`/não-flush (naipes diferentes).

- [ ] **Step 3: Implementar a checagem de flush com wild em `js/engine/poker.js`**

Dentro de `detectarEntreJogaveis`, substituir a linha do `flush` por uma checagem que aceita wild como naipe coringa:

```javascript
const flush = cartas.length === 5 && ehFlush(cartas);
```

E adicionar a função auxiliar (no mesmo arquivo, perto de `ehSequencia`):

```javascript
// Flush considerando wild como naipe coringa: existe um naipe tal que toda carta
// é desse naipe OU é wild. Wild NÃO altera rank (grupos/sequência por valor).
function ehFlush(cartas) {
  const ehWild = (c) => c.aprimoramento === "wild";
  const naipesReais = cartas.filter((c) => !ehWild(c)).map((c) => c.naipe);
  if (naipesReais.length === 0) return true; // 5 wilds → flush de qualquer naipe
  const alvo = naipesReais[0];
  return cartas.every((c) => ehWild(c) || c.naipe === alvo);
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — testes de wild verdes; os de flush existentes (sem wild) idênticos, pois sem wild `ehFlush` reduz a "todos do mesmo naipe".

- [ ] **Step 5: Commit**

```bash
git add js/engine/poker.js tests/poker.test.js
git commit -m "feat(aprimoramentos): wild conta como qualquer naipe no flush

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `scoring.js` — efeitos diretos (bonus, mult, pedra)

**Files:**
- Modify: `js/engine/scoring.js`
- Test: `tests/aprimoramentos.test.js`

**Contexto:** No loop `for (const carta of jogada.cartasQuePontuam)`, após somar os chips base e ANTES dos coringas reagirem (`aoPontuarCarta`), aplicar o efeito do aprimoramento da carta. Pedra NÃO soma `chipsDaCarta` (só os +50 do efeito). Reusar a função `aplicar(...)` (já emite evento; já suprime efeitos vazios).

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/aprimoramentos.test.js` (importar `pontuarJogada` e o helper de state; ver `tests/scoring.test.js` para o `stateBase`). Para evitar duplicar `stateBase`, criar um helper local mínimo no próprio arquivo:

```javascript
import { pontuarJogada } from "../js/engine/scoring.js";
import { MAOS } from "../js/data/hands.js";

const carta = (naipe, valor, apr = null) =>
  ({ id: `${naipe}-${valor}-${Math.random()}`, naipe, valor, aprimoramento: apr });

function stateBase(extra = {}) {
  return {
    rngEstado: 1, dinheiro: 0, coringas: [], consumiveis: [],
    niveisMaos: Object.fromEntries(Object.keys(MAOS).map((m) => [m, 1])),
    estatisticas: { porMao: {}, melhorJogada: 0, rodadas: 0 }, ultimaMaoJogada: null,
    blindAtual: { tipo: "pequena", chefeId: null, alvo: 300 },
    rodada: { baralho: [], mao: [], pontuacao: 0, maosRestantes: 4, descartesRestantes: 3, descartesUsados: 0, tiposJogados: [] },
    ...extra,
  };
}

teste("aprimoramento bonus: +30 chips na carta pontuada", () => {
  const state = stateBase();
  // par de 9: base chips 10+9+9=28, mult 2. Bônus numa carta: +30 chips.
  const { total } = pontuarJogada(state, [carta("copas", 9, "bonus"), carta("ouros", 9)]);
  igual(total, (28 + 30) * 2);
});

teste("aprimoramento mult: +4 mult na carta pontuada", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [carta("copas", 9, "mult"), carta("ouros", 9)]);
  igual(total, 28 * (2 + 4));
});

teste("aprimoramento pedra: +50 chips e não soma chips por rank", () => {
  const state = stateBase();
  // par de 9 + pedra: chips base 28 (só os dois 9) + 50 da pedra = 78; mult 2
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9), carta("paus", 2, "pedra")]);
  igual(total, (28 + 50) * 2);
});
```

(A `mao` em `rodada.mao` fica vazia nesses testes — aço/Task 6 trata a mão; aqui não há aço.)

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — sem efeito de aprimoramento, os totais batem o base (ex.: bonus daria `28*2` em vez de `58*2`).

- [ ] **Step 3: Implementar em `js/engine/scoring.js`**

No topo, importar `ehPedra` e os efeitos. Dentro do loop por carta, após o `eventos.push({ tipo: "carta", ... })`, **mas** pedra não deve somar `chipsDaCarta`. Ajustar:

```javascript
import { chipsDaCarta, ehPedra } from "./deck.js";
```

Substituir o trecho do loop por carta:

```javascript
  for (const carta of jogada.cartasQuePontuam) {
    if (chefe?.ganchos.cartaDebuffada?.(carta)) {
      eventos.push({ tipo: "carta-debuffada", carta });
      continue;
    }
    if (!ehPedra(carta)) {
      chips += chipsDaCarta(carta);
      eventos.push({ tipo: "carta", carta, chips: chipsDaCarta(carta), chipsTotal: chips });
    } else {
      eventos.push({ tipo: "carta", carta, chips: 0, chipsTotal: chips });
    }
    // Efeito do aprimoramento da carta — ANTES de os coringas reagirem a ela.
    aplicar(efeitoAprimoramentoNaCarta(carta), `aprimoramento:${carta.aprimoramento}`);
    for (const coringa of state.coringas) {
      aplicar(coringa.def.ganchos.aoPontuarCarta?.(carta, { ...ctx, coringa }), coringa.id);
    }
  }
```

Adicionar, antes de `pontuarJogada` ou logo após os imports, a função que mapeia aprimoramento → efeito **determinístico** (bonus/mult/pedra; vidro/sorte entram nas Tasks 7-8; aco/ouro não são por-carta-pontuada):

```javascript
// Efeitos de aprimoramento aplicados quando a CARTA pontua. bonus/mult/pedra são
// determinísticos; vidro e sorte (com RNG) são tratados à parte no loop principal.
function efeitoAprimoramentoNaCarta(carta) {
  switch (carta.aprimoramento) {
    case "bonus": return { chips: 30 };
    case "mult":  return { mult: 4 };
    case "pedra": return { chips: 50 };
    default:      return null;
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — bonus/mult/pedra verdes; testes de scoring existentes idênticos (cartas sem aprimoramento → `efeitoAprimoramentoNaCarta` retorna null → `aplicar` ignora).

- [ ] **Step 5: Commit**

```bash
git add js/engine/scoring.js tests/aprimoramentos.test.js
git commit -m "feat(aprimoramentos): bonus/mult/pedra no pipeline de pontuação

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `scoring.js` — aço (×1,5 mult por carta de aço NA MÃO)

**Files:**
- Modify: `js/engine/scoring.js`
- Test: `tests/aprimoramentos.test.js`

**Contexto:** Aço aplica `×1,5 mult` por carta de aço presente na **mão atual** (`state.rodada.mao`), mesmo que não tenha sido jogada. Aplicar logo após o loop das cartas que pontuam e antes dos `aoPontuarMao` dos coringas.

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/aprimoramentos.test.js`:

```javascript
teste("aprimoramento aco: ×1,5 mult por carta de aço na mão (mesmo sem jogar)", () => {
  const naMao = [carta("paus", 7, "aco"), carta("espadas", 3)];
  const state = stateBase({ rodada: { ...stateBase().rodada, mao: naMao } });
  // joga um par de 9 (não estão entre as de aço); aço na mão dá ×1,5
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, Math.floor(28 * (2 * 1.5)));
});

teste("aprimoramento aco: duas cartas de aço na mão multiplicam duas vezes", () => {
  const naMao = [carta("paus", 7, "aco"), carta("espadas", 3, "aco")];
  const state = stateBase({ rodada: { ...stateBase().rodada, mao: naMao } });
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, Math.floor(28 * (2 * 1.5 * 1.5)));
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — sem aço, total seria `28*2`.

- [ ] **Step 3: Implementar em `js/engine/scoring.js`**

Após o loop `for (const carta of jogada.cartasQuePontuam)` e antes do loop de `aoPontuarMao`, varrer a mão:

```javascript
  // Aço: ×1,5 mult por carta de aço SEGURADA na mão (não precisa ser jogada).
  const mao = state.rodada?.mao ?? [];
  for (const carta of mao) {
    if (carta.aprimoramento === "aco") aplicar({ xmult: 1.5 }, "aprimoramento:aco");
  }
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — testes de aço verdes; existentes idênticos (mãos de teste antigas não têm cartas de aço; `mao` vazio → nenhum efeito).

- [ ] **Step 5: Commit**

```bash
git add js/engine/scoring.js tests/aprimoramentos.test.js
git commit -m "feat(aprimoramentos): aço aplica ×1,5 mult por carta segurada na mão

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: `scoring.js` — vidro (×2 mult + destruição via RNG)

**Files:**
- Modify: `js/engine/scoring.js`
- Test: `tests/aprimoramentos.test.js`

**Contexto:** Vidro dá `×2 mult` sempre que pontua e, depois, rola `entre(state,1,4)===1` para quebrar. Quebrar NÃO muta estado em `scoring.js` — acumula a carta numa lista `cartasDestruidas` devolvida no resultado, e emite `{ tipo: "carta-destruida", carta }`. `pontuarJogada` passa a devolver `cartasDestruidas` no objeto de retorno.

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/aprimoramentos.test.js` (import de `entre` não é necessário; testamos via seeds):

```javascript
teste("aprimoramento vidro: ×2 mult sempre que pontua", () => {
  const state = stateBase({ rngEstado: 1 });
  const { total } = pontuarJogada(state, [carta("copas", 9, "vidro"), carta("ouros", 9)]);
  // chips 28, mult 2 ×2 = 4 → 112 (independe de quebrar ou não)
  igual(total, 28 * 4);
});

teste("aprimoramento vidro: em alguns seeds quebra (entra em cartasDestruidas)", () => {
  let quebrou = false, sobreviveu = false;
  for (let seed = 1; seed <= 40; seed++) {
    const state = stateBase({ rngEstado: seed });
    const c = carta("copas", 9, "vidro");
    const r = pontuarJogada(state, [c, carta("ouros", 9)]);
    if (r.cartasDestruidas.some((d) => d.id === c.id)) quebrou = true; else sobreviveu = true;
  }
  ok(quebrou, "nenhum seed quebrou — entre()/probabilidade pode estar errada");
  ok(sobreviveu, "todos quebraram — probabilidade pode estar errada");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `r.cartasDestruidas` indefinido; e sem efeito de vidro o total seria `28*2`.

- [ ] **Step 3: Implementar em `js/engine/scoring.js`**

No import do RNG: `import { entre } from "./rng.js";`. Criar `const cartasDestruidas = [];` perto de `eventos`. No loop por carta, tratar vidro (após `efeitoAprimoramentoNaCarta`, que retorna null para vidro):

```javascript
    if (carta.aprimoramento === "vidro") {
      aplicar({ xmult: 2 }, "aprimoramento:vidro");
      if (entre(state, 1, 4) === 1) {
        cartasDestruidas.push(carta);
        eventos.push({ tipo: "carta-destruida", carta });
      }
    }
```

E no retorno: `return { total, eventos, jogada, cartasDestruidas };`

> Nota de ordem/determinismo (comentar no código): vidro e sorte consomem o RNG da run durante a pontuação; a ordem em que as cartas pontuam afeta o fluxo de RNG da mão — mesmo padrão do Coringa Misterioso.

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — vidro verde; demais retornos de `pontuarJogada` ganham `cartasDestruidas: []` sem quebrar quem desestrutura só `{total, eventos, jogada}`.

- [ ] **Step 5: Commit**

```bash
git add js/engine/scoring.js tests/aprimoramentos.test.js
git commit -m "feat(aprimoramentos): vidro ×2 mult + marca destruição (RNG na pontuação)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: `scoring.js` — sorte (RNG: +20 mult e/ou +$20)

**Files:**
- Modify: `js/engine/scoring.js`
- Test: `tests/aprimoramentos.test.js`

**Contexto:** Sorte rola `entre(state,1,5)===1` → `{mult:20}` (emite via `aplicar`) e `entre(state,1,15)===1` → acumula +$20 num total `dinheiroSorte` devolvido no resultado (creditar é responsabilidade de `run.js`, Task 10).

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/aprimoramentos.test.js`:

```javascript
teste("aprimoramento sorte: pipeline devolve dinheiroSorte (0 ou múltiplo de 20)", () => {
  const state = stateBase({ rngEstado: 1 });
  const r = pontuarJogada(state, [carta("copas", 9, "sorte"), carta("ouros", 9)]);
  ok(typeof r.dinheiroSorte === "number", "deve devolver dinheiroSorte");
  ok(r.dinheiroSorte % 20 === 0, `dinheiroSorte deve ser múltiplo de 20, veio ${r.dinheiroSorte}`);
});

teste("aprimoramento sorte: em alguns seeds concede +20 mult", () => {
  let concedeu = false;
  for (let seed = 1; seed <= 40; seed++) {
    const state = stateBase({ rngEstado: seed });
    const { eventos } = pontuarJogada(state, [carta("copas", 9, "sorte"), carta("ouros", 9)]);
    if (eventos.some((e) => e.tipo === "efeito" && e.origem === "aprimoramento:sorte" && e.mult === 20)) concedeu = true;
  }
  ok(concedeu, "nenhum seed concedeu +20 mult — probabilidade 1/5 pode estar errada");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `dinheiroSorte` indefinido.

- [ ] **Step 3: Implementar em `js/engine/scoring.js`**

Criar `let dinheiroSorte = 0;` perto de `eventos`. No loop por carta, tratar sorte:

```javascript
    if (carta.aprimoramento === "sorte") {
      if (entre(state, 1, 5) === 1) aplicar({ mult: 20 }, "aprimoramento:sorte");
      if (entre(state, 1, 15) === 1) dinheiroSorte += 20;
    }
```

Atualizar o retorno: `return { total, eventos, jogada, cartasDestruidas, dinheiroSorte };`

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/engine/scoring.js tests/aprimoramentos.test.js
git commit -m "feat(aprimoramentos): sorte concede +20 mult e/ou +\$20 (RNG na pontuação)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: `state.js` + `run.js` — baralho-mestre da run

**Files:**
- Modify: `js/state.js`
- Modify: `js/engine/run.js`
- Test: `tests/state.test.js`, `tests/run.test.js`

**Contexto:** `criarRun()` cria `state.baralhoRun = criarBaralho()`. `iniciarBlind` embaralha uma cópia dele. `salvar` inclui `baralhoRun`. `VERSAO_SAVE → 5`. Sem migração (saves de outra versão já são descartados em `carregar`).

- [ ] **Step 1: Escrever os testes (falham)**

Adicionar em `tests/state.test.js`:

```javascript
teste("state: criarRun cria baralhoRun de 52 cartas com aprimoramento null", () => {
  const s = criarRun(123);
  ok(Array.isArray(s.baralhoRun) && s.baralhoRun.length === 52, "baralhoRun deve ter 52 cartas");
  ok(s.baralhoRun.every((c) => c.aprimoramento === null));
});

teste("state: VERSAO_SAVE é 5", () => {
  igual(VERSAO_SAVE, 5);
});
```

**Alterar o import existente** de `tests/state.test.js` para incluir `VERSAO_SAVE` (atual: `import { criarRun, salvar, carregar, apagarSave } from "../js/state.js";`):

```javascript
import { criarRun, salvar, carregar, apagarSave, VERSAO_SAVE } from "../js/state.js";
```

Adicionar em `tests/run.test.js`:

```javascript
teste("run: o baralho da rodada vem do baralhoRun (aprimoramentos persistem)", () => {
  const s = criarRun(123);
  s.baralhoRun[0].aprimoramento = "mult";
  iniciarBlind(s, "pequena");
  const total = s.rodada.baralho.length + s.rodada.mao.length;
  igual(total, 52, "rodada começa com as 52 cartas do baralhoRun");
  const todas = [...s.rodada.baralho, ...s.rodada.mao];
  ok(todas.some((c) => c.aprimoramento === "mult"), "o aprimoramento do baralhoRun deve aparecer na rodada");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `baralhoRun` indefinido; `VERSAO_SAVE` ainda 4.

- [ ] **Step 3: Implementar**

Em `js/state.js`:
- Trocar `export const VERSAO_SAVE = 4;` por `5`.
- Importar `criarBaralho` de `./engine/deck.js`.
- Em `criarRun`, adicionar ao objeto `state`: `baralhoRun: criarBaralho(),` (antes de `state.chefesPorAnte = ...`).
- Em `salvar`, incluir `baralhoRun` (já é serializável; o spread atual `{ ...state, coringas: ... }` já o inclui — confirmar que nada o remove).

Em `js/engine/run.js`:
- Importar `copiarBaralho`: `import { criarBaralho, copiarBaralho } from "./deck.js";`
- Em `iniciarBlind`, trocar `baralho: embaralhar(state, criarBaralho()),` por:

```javascript
    baralho: embaralhar(state, copiarBaralho(state.baralhoRun)),
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — baralhoRun verde; testes de run existentes idênticos (52 cartas limpas).

- [ ] **Step 5: Commit**

```bash
git add js/state.js js/engine/run.js tests/state.test.js tests/run.test.js
git commit -m "feat(aprimoramentos): baralho-mestre da run persistente (VERSAO_SAVE 5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: `run.js` — destruição de vidro + crédito do dinheiro de sorte

**Files:**
- Modify: `js/engine/run.js`
- Test: `tests/run.test.js`

**Contexto:** Em `jogar`, após `pontuarJogada`, remover `cartasDestruidas` do `state.baralhoRun` por `id`, e creditar `dinheiroSorte`.

- [ ] **Step 1: Escrever o teste (falha)**

Adicionar em `tests/run.test.js`:

```javascript
teste("run: carta de vidro que quebra some do baralhoRun", () => {
  const s = criarRun(123);
  // Marca uma carta específica como vidro no baralhoRun e na mão da rodada.
  iniciarBlind(s, "pequena");
  const alvo = s.rodada.mao[0];
  alvo.aprimoramento = "vidro";
  // Também marca no baralhoRun a carta de mesmo id, que é o que jogar() remove.
  const noMestre = s.baralhoRun.find((c) => c.id === alvo.id);
  if (noMestre) noMestre.aprimoramento = "vidro";
  const antes = s.baralhoRun.length;
  // Forçar quebra: roda jogar() com a carta de vidro até cartasDestruidas conter o id.
  // Como o RNG é determinístico, testamos o EFEITO de jogar() removendo do baralhoRun
  // injetando cartasDestruidas via pontuarJogada real — joga a carta de vidro sozinha.
  const idx = s.rodada.mao.indexOf(alvo);
  // joga o índice da carta de vidro (1 carta = carta-alta, ainda pontua e pode quebrar)
  // Repete em estados independentes até observar a remoção, mantendo determinismo por seed.
  let removeu = false;
  for (let seed = 1; seed <= 40 && !removeu; seed++) {
    const s2 = criarRun(123);
    iniciarBlind(s2, "pequena");
    s2.rngEstado = seed;
    const carta = s2.rodada.mao[0];
    carta.aprimoramento = "vidro";
    const espelho = s2.baralhoRun.find((c) => c.id === carta.id);
    if (espelho) espelho.aprimoramento = "vidro";
    const tam = s2.baralhoRun.length;
    s2.rodada.maosRestantes = 4;
    s2.blindAtual.alvo = 10 ** 9; // não vencer a blind, só pontuar
    jogar(s2, [s2.rodada.mao.indexOf(carta)]);
    if (s2.baralhoRun.length === tam - 1) removeu = true;
  }
  ok(removeu, "em nenhum seed o vidro foi removido do baralhoRun");
});

teste("run: dinheiroSorte é creditado ao jogador", () => {
  // Procura um seed em que a sorte conceda +$20 e verifica que o dinheiro subiu.
  let creditou = false;
  for (let seed = 1; seed <= 60 && !creditou; seed++) {
    const s = criarRun(123);
    iniciarBlind(s, "pequena");
    s.rngEstado = seed;
    s.blindAtual.alvo = 10 ** 9;
    const carta = s.rodada.mao[0];
    carta.aprimoramento = "sorte";
    const dinheiroAntes = s.dinheiro;
    jogar(s, [s.rodada.mao.indexOf(carta)]);
    if (s.dinheiro >= dinheiroAntes + 20) creditou = true;
  }
  ok(creditou, "nenhum seed creditou o dinheiro de sorte");
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `jogar` ainda não remove do `baralhoRun` nem credita `dinheiroSorte`.

- [ ] **Step 3: Implementar em `js/engine/run.js`**

Na função `jogar`, capturar os novos campos e aplicar logo após `rodada.pontuacao += total;`:

```javascript
  const { total, eventos, cartasDestruidas, dinheiroSorte } = pontuarJogada(state, cartas);

  rodada.pontuacao += total;
  if (dinheiroSorte) state.dinheiro += dinheiroSorte;
  if (cartasDestruidas?.length) {
    const ids = new Set(cartasDestruidas.map((c) => c.id));
    state.baralhoRun = state.baralhoRun.filter((c) => !ids.has(c.id));
  }
```

(Manter o restante de `jogar` como está: `maosRestantes -= 1`, etc.)

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/engine/run.js tests/run.test.js
git commit -m "feat(aprimoramentos): vidro remove do baralhoRun e sorte credita dinheiro

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: `run.js` — ouro no fim da rodada (+$3 se na mão)

**Files:**
- Modify: `js/engine/run.js`
- Test: `tests/run.test.js`

**Contexto:** Em `vencerBlind`, junto do loop de `aoFimDaRodada` dos coringas, somar `+$3` por carta de ouro presente em `state.rodada.mao` no momento da vitória.

- [ ] **Step 1: Escrever o teste (falha)**

Adicionar em `tests/run.test.js`:

```javascript
teste("run: ouro dá +$3 por carta de ouro na mão ao vencer a blind", () => {
  const s = criarRun(123);
  iniciarBlind(s, "pequena");
  s.rodada.mao = [
    { id: "g1", naipe: "copas", valor: 9, aprimoramento: "ouro" },
    { id: "g2", naipe: "ouros", valor: 8, aprimoramento: "ouro" },
    { id: "n1", naipe: "paus", valor: 7, aprimoramento: null },
  ];
  s.blindAtual.alvo = 1; // vencer com qualquer jogada
  const dinheiroAntes = s.dinheiro;
  // joga uma carta qualquer da mão para vencer; ouro conta as cartas que SOBRAM na mão
  jogar(s, [2]); // joga a 'n1'; g1 e g2 (ouro) ficam na mão
  ok(s.dinheiro >= dinheiroAntes + 6, "duas cartas de ouro na mão deveriam render +$6");
});
```

> Nota: `jogar` filtra as cartas jogadas da mão antes de `vencerBlind`, então as duas de ouro permanecem em `state.rodada.mao` na hora de contar. Confirmar esse comportamento contra `run.js:92` (filtro) → `run.js:95` (vencerBlind).

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — ouro ainda não credita.

- [ ] **Step 3: Implementar em `js/engine/run.js`**

Em `vencerBlind`, após o loop dos coringas que monta `dinheiroExtra`/`destruidos` e antes de calcular a recompensa, somar o ouro:

```javascript
  // Ouro: +$3 por carta de ouro que sobrou na mão ao vencer a blind.
  const ouroNaMao = state.rodada.mao.filter((c) => c.aprimoramento === "ouro").length;
  if (ouroNaMao) dinheiroExtra += 3 * ouroNaMao;
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/engine/run.js tests/run.test.js
git commit -m "feat(aprimoramentos): ouro dá +\$3 por carta na mão no fim da rodada

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: `taros.js` — "O Mago" (prova viva)

**Files:**
- Modify: `js/data/taros.js`
- Test: `tests/consumiveis.test.js`

**Contexto:** Tarô que aplica **Mult** a até 2 cartas. Sem UI de seleção (Sub-etapa B): aplica às 2 primeiras cartas da `state.rodada.mao` se houver rodada ativa, senão às 2 primeiras de `state.baralhoRun`, marcando no `baralhoRun` (persiste). Segue o shape de `taros.js` (`{ id, nome, icone, descricao, aplicar(state) }`).

- [ ] **Step 1: Escrever o teste (falha)**

Em `tests/consumiveis.test.js`, **adicionar `iniciarBlind` aos imports** (o arquivo já importa `criarRun` de `../js/state.js` e `TAROS` de `../js/data/taros.js`; falta `iniciarBlind`):

```javascript
import { iniciarBlind } from "../js/engine/run.js";
```

Depois adicionar os testes:

```javascript
teste("taro O Mago: aplica Mult a até 2 cartas do baralhoRun (sem rodada)", () => {
  const s = criarRun(123);
  s.rodada = null;
  const r = TAROS["o-mago"].aplicar(s);
  ok(!r.erro, "não deve falhar");
  const comMult = s.baralhoRun.filter((c) => c.aprimoramento === "mult").length;
  igual(comMult, 2, "duas cartas do baralhoRun viram Mult");
});

teste("taro O Mago: com rodada ativa, aplica nas cartas da mão e persiste no baralhoRun", () => {
  const s = criarRun(123);
  iniciarBlind(s, "pequena");
  const alvo = s.rodada.mao[0];
  TAROS["o-mago"].aplicar(s);
  igual(s.rodada.mao[0].aprimoramento, "mult", "a 1ª carta da mão vira Mult");
  const noMestre = s.baralhoRun.find((c) => c.id === alvo.id);
  ok(noMestre && noMestre.aprimoramento === "mult", "o aprimoramento persiste no baralhoRun");
});
```

(Garantir imports de `criarRun`, `iniciarBlind`, `TAROS` no arquivo de teste; ver os imports já usados em `consumiveis.test.js`.)

- [ ] **Step 2: Rodar para ver falhar**

Run: `node tests/todos.js`
Expected: FAIL — `TAROS["o-mago"]` indefinido.

- [ ] **Step 3: Implementar em `js/data/taros.js`**

Acrescentar à `LISTA` (e nada mais muda; `TAROS` é montado a partir dela):

```javascript
  { id: "o-mago", nome: "O Mago", icone: "✦", descricao: "Aplica Mult a até 2 cartas selecionadas.",
    // Sub-etapa A (núcleo): sem UI de seleção ainda — aplica nas 2 primeiras cartas da mão
    // (ou do baralhoRun se não houver rodada) e persiste no baralhoRun. Seleção interativa
    // vem na Sub-etapa B (fontes).
    aplicar: (state) => {
      const aplicarEm = (carta) => {
        if (!carta) return;
        carta.aprimoramento = "mult";
        const mestre = state.baralhoRun?.find((c) => c.id === carta.id);
        if (mestre && mestre !== carta) mestre.aprimoramento = "mult";
      };
      const fonte = state.rodada?.mao?.length ? state.rodada.mao : (state.baralhoRun ?? []);
      aplicarEm(fonte[0]);
      aplicarEm(fonte[1]);
      return {};
    } },
```

- [ ] **Step 4: Rodar para ver passar**

Run: `node tests/todos.js`
Expected: PASS — O Mago verde; todos os testes (115+ agora) verdes.

- [ ] **Step 5: Commit**

```bash
git add js/data/taros.js tests/consumiveis.test.js
git commit -m "feat(aprimoramentos): tarô 'O Mago' aplica Mult (prova viva da Sub-etapa A)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Encerramento (após as 12 tasks)

- [ ] Rodar `node tests/todos.js` uma última vez — tudo verde.
- [ ] Atualizar `docs/superpowers/plans/PROGRESSO.md` e a memória de auditoria: Sub-etapa A do "Aprimoramentos de carta" concluída; próximas B (fontes) e C (visual).
- [ ] Decidir merge/push com o usuário (ele acompanha pelo deploy do GitHub Pages — push na main após validar).

---

## Notas de fidelidade / risco

- **Ordem dos efeitos** (documentar em `scoring.js`): por carta → chips base (exceto pedra) → aprimoramento da carta (bonus/mult/pedra/vidro/sorte) → coringas `aoPontuarCarta`; depois do loop → aço (mão) → coringas `aoPontuarMao` → total.
- **Determinismo:** vidro e sorte consomem RNG na pontuação (padrão do Coringa Misterioso). A ordem em que as cartas pontuam afeta o fluxo de RNG da mão.
- **Regressão:** o maior risco é `poker.js`. Cartas sem aprimoramento devem detectar mão de forma idêntica (pedras vazio → `jogaveis` = todas; sem wild → `ehFlush` = "todas do mesmo naipe"). Os testes existentes guardam isso.

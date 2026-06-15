# Mais Coringas (lote +25) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 25 coringas adaptados do Balatro a `js/data/jokers.js`, subindo o total de 25 para 50, usando apenas ganchos/efeitos que o motor já suporta.

**Architecture:** Cada coringa é um objeto de dados em `LISTA` (`js/data/jokers.js`) com `{ id, nome, raridade, preco, descricao, estadoInicial?, ganchos }`. O pipeline (`scoring.js`/`run.js`) e a loja (`shop.js`) já consomem essa lista sem alteração — adicionar entradas é puramente aditivo. Helpers locais (`porCarta`, reuso de `maoContem`/`ehFigura`) mantêm os efeitos curtos. Sem mudança no engine, sem bump de save.

**Tech Stack:** JavaScript ES modules sem build; harness de testes próprio (`tests/harness.js` → `teste/ok/igual`); RNG determinístico (`entre(state, min, max)`).

**Spec:** `docs/superpowers/specs/2026-06-15-mais-coringas-design.md`

**Convenções (todas as tarefas):** código/comentários em PT-BR; zero dependências; rodar a suíte com `node tests/todos.js`; todo commit termina com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## Estado inicial (confirmado)

- `js/data/jokers.js`: 25 coringas em `LISTA` (14 comuns / 8 incomuns / 3 raros), exporta `CORINGAS`, `novoCoringa`, `sufixoEstado`, `corDoCoringa`. Importa `ehFigura` de `deck.js`, `maoContem` de `hands.js`, `entre` de `rng.js`.
- Ganchos suportados: `aoPontuarCarta(carta, ctx)`, `aoPontuarMao(ctx)`, `aoFimDaRodada(ctx)`, `aoDescartar(ctx)`, `aoUsarPlaneta(ctx)`, `aoComprarCoringa(ctx)`. Efeitos: `{ chips, mult, xmult, dinheiro, destruir }`.
- `node tests/todos.js` → **113 teste(s), 0 falha(s)** antes de começar.
- O teste `data.test.js` linha 18 afirma "25 coringas — 14 comuns, 8 incomuns, 3 raros" e **vai falhar** assim que adicionarmos coringas. Por isso a Task 1 atualiza esse teste PRIMEIRO (ele passa a exigir 50; fica vermelho até as Tasks 2–5 adicionarem todos).

## File Structure

- **Modify** `js/data/jokers.js` — adicionar 25 entradas a `LISTA` + helper local `porCarta`. Único arquivo de produção alterado.
- **Modify** `tests/data.test.js:18-29` — atualizar contagem 25→50 e proporção; reforçar unicidade de ids.
- **Modify** `tests/scoring.test.js` — novos testes de pontuação (por-carta, por-mão, estado, dinheiro-no-state).
- **Modify** `tests/run.test.js` — teste de `coringa-ouro` (dinheiro ao fim da rodada).

## Ordem das tarefas

1. **Task 1** — atualizar teste de contagem (50/28/16/6) + unicidade. *(fica vermelho de propósito)*
2. **Task 2** — coringas por-carta (8 entradas) + testes.
3. **Task 3** — coringas por-mão condicionais e baseados no state (10 entradas) + testes.
4. **Task 4** — coringas com estado interno (5 entradas) + testes.
5. **Task 5** — `coringa-ouro` (fim de rodada) + `misterioso` (aleatório) — 2 entradas + testes.

Ao fim da Task 5, todos os 25 estão presentes → o teste da Task 1 fica verde.

---

### Task 1: Atualizar o teste de inventário de coringas (50 no total)

**Files:**
- Modify/Test: `tests/data.test.js:18-29`

- [ ] **Step 1: Reescrever o teste de contagem**

Substituir o bloco `teste("jokers: 25 coringas — 14 comuns, 8 incomuns, 3 raros", ...)` (linhas 18–29) por:

```javascript
teste("jokers: 50 coringas — 28 comuns, 16 incomuns, 6 raros", () => {
  const lista = Object.values(CORINGAS);
  igual(lista.length, 50);
  igual(lista.filter((c) => c.raridade === "comum").length, 28);
  igual(lista.filter((c) => c.raridade === "incomum").length, 16);
  igual(lista.filter((c) => c.raridade === "raro").length, 6);
  igual(new Set(lista.map((c) => c.id)).size, 50, "ids únicos");
  for (const c of lista) {
    ok(c.id && c.nome && c.descricao, `coringa incompleto: ${c.id}`);
    ok(c.preco >= 3 && c.preco <= 9, `preço fora da faixa: ${c.id}`);
    ok(Object.keys(c.ganchos).length > 0, `coringa sem ganchos: ${c.id}`);
  }
});
```

- [ ] **Step 2: Rodar e verificar que FALHA**

Run: `node tests/todos.js`
Expected: FALHA em `jokers: 50 coringas` (esperado 50, recebido 25). As demais 112 passam. Esse vermelho é esperado e some na Task 5.

- [ ] **Step 3: Commit**

```bash
git add tests/data.test.js
git commit -m "test: exige 50 coringas (28/16/6) — vermelho até o lote completar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Coringas por-carta (7 entradas)

Adiciona 7 coringas que reagem a cada carta pontuada via `aoPontuarCarta`: 6 comuns (`steven-par`, `todd-impar`, `cara-assustadora`, `cara-sorridente`, `erudito`, `walkie-talkie`) + 1 incomum (`fibonacci`).

**Files:**
- Modify: `js/data/jokers.js`
- Test: `tests/scoring.test.js`

- [ ] **Step 1: Escrever os testes de pontuação (falham primeiro)**

Adicionar ao fim de `tests/scoring.test.js`:

```javascript
teste("scoring: steven-par soma só em valores pares (A=14 conta como ímpar)", () => {
  const state = stateBase({ coringas: [novoCoringa("steven-par")] }); // +4 mult por par
  // dois 10 (par) pontuam como par de pôquer; +4 mult cada = +8
  const { total } = pontuarJogada(state, [carta("copas", 10), carta("ouros", 10)]);
  // chips 10+10+10=30; mult 2 + 4 + 4 = 10
  igual(total, 30 * 10);
  // Ases não somam (tratados como ímpar)
  const s2 = stateBase({ coringas: [novoCoringa("steven-par")] });
  const r2 = pontuarJogada(s2, [carta("copas", 14), carta("ouros", 14)]);
  igual(r2.total, (10 + 11 + 11) * 2, "Ás é ímpar para o Steven Par");
});

teste("scoring: todd-impar soma em ímpares e no Ás", () => {
  const state = stateBase({ coringas: [novoCoringa("todd-impar")] }); // +31 chips por ímpar
  const { total } = pontuarJogada(state, [carta("copas", 14), carta("ouros", 14)]);
  // chips 10+11+11 + 31 + 31 = 94; mult 2
  igual(total, (32 + 62) * 2);
});

teste("scoring: erudito dá chips e mult por Ás", () => {
  const state = stateBase({ coringas: [novoCoringa("erudito")] }); // Ás: +20 chips, +4 mult
  const { total } = pontuarJogada(state, [carta("copas", 14), carta("ouros", 14)]);
  // chips 10+11+11 + 20 + 20 = 72; mult 2 + 4 + 4 = 10
  igual(total, 72 * 10);
});

teste("scoring: cara-assustadora e cara-sorridente contam figuras", () => {
  const a = stateBase({ coringas: [novoCoringa("cara-assustadora")] }); // +30 chips/figura
  // par de reis (K=13): chips 10+10+10 + 30 + 30 = 80; mult 2
  igual(pontuarJogada(a, [carta("copas", 13), carta("ouros", 13)]).total, 80 * 2);
  const b = stateBase({ coringas: [novoCoringa("cara-sorridente")] }); // +5 mult/figura
  igual(pontuarJogada(b, [carta("copas", 13), carta("ouros", 13)]).total, 30 * (2 + 5 + 5));
});

teste("scoring: walkie-talkie conta 10 e 4", () => {
  const state = stateBase({ coringas: [novoCoringa("walkie-talkie")] }); // 10 ou 4: +10 chips, +4 mult
  // par de 10: chips 10+10+10 + 10 + 10 = 50; mult 2 + 4 + 4 = 10
  igual(pontuarJogada(state, [carta("copas", 10), carta("ouros", 10)]).total, 50 * 10);
});

teste("scoring: fibonacci conta A/2/3/5/8", () => {
  const state = stateBase({ coringas: [novoCoringa("fibonacci")] }); // +8 mult por A/2/3/5/8
  // par de 5: chips 10+5+5=20; mult 2 + 8 + 8 = 18
  igual(pontuarJogada(state, [carta("copas", 5), carta("ouros", 5)]).total, 20 * 18);
  // par de 4 (não-fibonacci): mult fica 2
  const s2 = stateBase({ coringas: [novoCoringa("fibonacci")] });
  igual(pontuarJogada(s2, [carta("copas", 4), carta("ouros", 4)]).total, (10 + 4 + 4) * 2);
});
```

- [ ] **Step 2: Rodar e verificar que FALHAM**

Run: `node tests/todos.js`
Expected: FALHA com erro do `novoCoringa("steven-par")` etc. (`CORINGAS[id]` é `undefined` → `def.estadoInicial` lança TypeError, ou os ids não existem). Confirma que os coringas ainda não foram criados.

- [ ] **Step 3: Adicionar o helper `porCarta` e as 7 entradas**

Em `js/data/jokers.js`, logo após `maisTresPorNaipe`/`seContem` (topo do arquivo), adicionar o helper:

```javascript
// Aplica um efeito fixo a cada carta pontuada que satisfaz o predicado.
function porCarta(predicado, efeito) {
  return (carta) => (predicado(carta) ? efeito : null);
}

// Paridade do valor para Steven Par / Todd Ímpar.
// O Ás (14) conta como ÍMPAR, como no Balatro (e o 10 é par).
function ehPar(carta) {
  return carta.valor !== 14 && carta.valor % 2 === 0;
}
```

Adicionar ao bloco de Comuns de `LISTA` (antes do comentário `// ── Incomuns`):

```javascript
  { id: "steven-par", nome: "Steven Par", raridade: "comum", preco: 4,
    descricao: "+4 mult por carta de valor par (2,4,6,8,10) pontuada",
    ganchos: { aoPontuarCarta: porCarta(ehPar, { mult: 4 }) } },
  { id: "todd-impar", nome: "Todd Ímpar", raridade: "comum", preco: 4,
    descricao: "+31 chips por carta de valor ímpar (A,3,5,7,9) pontuada",
    ganchos: { aoPontuarCarta: porCarta((c) => !ehPar(c), { chips: 31 }) } },
  { id: "cara-assustadora", nome: "Cara Assustadora", raridade: "comum", preco: 4,
    descricao: "+30 chips por figura (J/Q/K) pontuada",
    ganchos: { aoPontuarCarta: porCarta(ehFigura, { chips: 30 }) } },
  { id: "cara-sorridente", nome: "Cara Sorridente", raridade: "comum", preco: 4,
    descricao: "+5 mult por figura (J/Q/K) pontuada",
    ganchos: { aoPontuarCarta: porCarta(ehFigura, { mult: 5 }) } },
  { id: "erudito", nome: "Erudito", raridade: "comum", preco: 4,
    descricao: "Cada Ás pontuado dá +20 chips e +4 mult",
    ganchos: { aoPontuarCarta: porCarta((c) => c.valor === 14, { chips: 20, mult: 4 }) } },
  { id: "walkie-talkie", nome: "Walkie Talkie", raridade: "comum", preco: 4,
    descricao: "Cada 10 ou 4 pontuado dá +10 chips e +4 mult",
    ganchos: { aoPontuarCarta: porCarta((c) => c.valor === 10 || c.valor === 4, { chips: 10, mult: 4 }) } },
```

Adicionar ao bloco de Incomuns (antes de `// ── Raros`):

```javascript
  { id: "fibonacci", nome: "Fibonacci", raridade: "incomum", preco: 7,
    descricao: "+8 mult por carta de valor A, 2, 3, 5 ou 8 pontuada",
    ganchos: { aoPontuarCarta: porCarta((c) => [14, 2, 3, 5, 8].includes(c.valor), { mult: 8 }) } },
```

- [ ] **Step 4: Rodar e verificar que os testes da Task 2 PASSAM**

Run: `node tests/todos.js`
Expected: os 6 testes novos de scoring passam. O teste `jokers: 50 coringas` ainda FALHA (agora 32, não 50) — esperado.

- [ ] **Step 5: Commit**

```bash
git add js/data/jokers.js tests/scoring.test.js
git commit -m "feat: 7 coringas por-carta (Steven Par, Todd Ímpar, Fibonacci, etc.)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Coringas por-mão condicionais e baseados no state (11 entradas)

Coringas que retornam efeito uma vez por jogada via `aoPontuarMao`, sem estado interno: 8 comuns (`coringa-alegre`, `coringa-astuto`, `coringa-travesso`, `coringa-diabrete`, `coringa-malandro`, `coringa-devoto`, `arena`, `acrobata`) + 2 incomuns (`estencil`, `abstrato`) + 1 raro (`coturno`).

**Files:**
- Modify: `js/data/jokers.js`
- Test: `tests/scoring.test.js`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

Adicionar ao fim de `tests/scoring.test.js`:

```javascript
teste("scoring: coringa-alegre e coringa-astuto exigem Par", () => {
  const alegre = stateBase({ coringas: [novoCoringa("coringa-alegre")] }); // +8 mult se contém Par
  igual(pontuarJogada(alegre, [carta("copas", 9), carta("ouros", 9)]).total, 28 * (2 + 8));
  // carta-alta (sem par) não ativa
  const semPar = stateBase({ coringas: [novoCoringa("coringa-alegre")] });
  igual(pontuarJogada(semPar, [carta("copas", 9), carta("ouros", 2)]).total, (5 + 9) * 1);
  const astuto = stateBase({ coringas: [novoCoringa("coringa-astuto")] }); // +50 chips se contém Par
  igual(pontuarJogada(astuto, [carta("copas", 9), carta("ouros", 9)]).total, (28 + 50) * 2);
});

teste("scoring: coringa-travesso exige Trinca", () => {
  const state = stateBase({ coringas: [novoCoringa("coringa-travesso")] }); // +12 mult se contém Trinca
  const cartas = [carta("copas", 9), carta("ouros", 9), carta("paus", 9)];
  // trinca: chips 30+27=57, mult 3 + 12 = 15
  igual(pontuarJogada(state, cartas).total, 57 * 15);
});

teste("scoring: coringa-diabrete e coringa-malandro exigem Flush", () => {
  const flush = () => [
    carta("copas", 2), carta("copas", 5), carta("copas", 7),
    carta("copas", 9), carta("copas", 11),
  ];
  const dia = stateBase({ coringas: [novoCoringa("coringa-diabrete")] }); // +10 mult se Flush
  // flush nivel 1: chips 35 + (2+5+7+9+10)=35+33=68; mult 4 + 10 = 14
  igual(pontuarJogada(dia, flush()).total, 68 * 14);
  const mal = stateBase({ coringas: [novoCoringa("coringa-malandro")] }); // +80 chips se Flush
  igual(pontuarJogada(mal, flush()).total, (68 + 80) * 4);
  // mão sem flush não ativa o diabrete
  const semFlush = stateBase({ coringas: [novoCoringa("coringa-diabrete")] });
  igual(pontuarJogada(semFlush, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2);
});

teste("scoring: coringa-devoto exige Sequência", () => {
  const state = stateBase({ coringas: [novoCoringa("coringa-devoto")] }); // +100 chips se Sequência
  const seq = [
    carta("copas", 5), carta("ouros", 6), carta("paus", 7),
    carta("espadas", 8), carta("copas", 9),
  ];
  // sequência nível 1: chips 30 + (5+6+7+8+9)=30+35=65; +100 = 165; mult 4
  igual(pontuarJogada(state, seq).total, 165 * 4);
});

teste("scoring: arena e coturno usam o dinheiro do jogador", () => {
  const arena = stateBase({ coringas: [novoCoringa("arena")], dinheiro: 7 }); // +2 chips por $1
  // chips 28 + 14 = 42; mult 2
  igual(pontuarJogada(arena, [carta("copas", 9), carta("ouros", 9)]).total, 42 * 2);
  const coturno = stateBase({ coringas: [novoCoringa("coturno")], dinheiro: 12 }); // +2 mult por $5
  // floor(12/5)=2 → +4 mult; chips 28; mult 2 + 4 = 6
  igual(pontuarJogada(coturno, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 6);
});

teste("scoring: acrobata só na última mão", () => {
  const ultima = stateBase({ coringas: [novoCoringa("acrobata")] }); // ×3 na última mão
  ultima.rodada.maosRestantes = 1;
  igual(pontuarJogada(ultima, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2 * 3);
  const naoUltima = stateBase({ coringas: [novoCoringa("acrobata")] });
  naoUltima.rodada.maosRestantes = 2;
  igual(pontuarJogada(naoUltima, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2);
});

teste("scoring: estencil multiplica por slots vazios + 1", () => {
  // 1 coringa (o próprio Estêncil) → 4 vazios → ×5
  const state = stateBase({ coringas: [novoCoringa("estencil")] });
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2 * 5);
});

teste("scoring: abstrato soma por coringa possuído", () => {
  // 2 coringas → +6 mult (conta a si mesmo)
  const state = stateBase({ coringas: [novoCoringa("abstrato"), novoCoringa("coringa")] });
  // ordem: aoPontuarMao roda na ordem da lista; abstrato +6, coringa +4 → mult 2+6+4=12
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 12);
});
```

- [ ] **Step 2: Rodar e verificar que FALHAM**

Run: `node tests/todos.js`
Expected: FALHA nos testes novos (`novoCoringa("coringa-alegre")` → id inexistente).

- [ ] **Step 3: Adicionar as 11 entradas**

Em `js/data/jokers.js`, adicionar ao bloco de Comuns:

```javascript
  { id: "coringa-alegre", nome: "Coringa Alegre", raridade: "comum", preco: 3,
    descricao: "+8 mult se a mão jogada contém um Par",
    ganchos: { aoPontuarMao: seContem("par", { mult: 8 }) } },
  { id: "coringa-astuto", nome: "Coringa Astuto", raridade: "comum", preco: 3,
    descricao: "+50 chips se a mão jogada contém um Par",
    ganchos: { aoPontuarMao: seContem("par", { chips: 50 }) } },
  { id: "coringa-travesso", nome: "Coringa Travesso", raridade: "comum", preco: 4,
    descricao: "+12 mult se a mão jogada contém uma Trinca",
    ganchos: { aoPontuarMao: seContem("trinca", { mult: 12 }) } },
  { id: "coringa-diabrete", nome: "Coringa Diabrete", raridade: "comum", preco: 4,
    descricao: "+10 mult se a mão jogada é Naipe (Flush)",
    ganchos: { aoPontuarMao: seContem("flush", { mult: 10 }) } },
  { id: "coringa-malandro", nome: "Coringa Malandro", raridade: "comum", preco: 4,
    descricao: "+80 chips se a mão jogada é Naipe (Flush)",
    ganchos: { aoPontuarMao: seContem("flush", { chips: 80 }) } },
  { id: "coringa-devoto", nome: "Coringa Devoto", raridade: "comum", preco: 4,
    descricao: "+100 chips se a mão jogada contém uma Sequência",
    ganchos: { aoPontuarMao: seContem("sequencia", { chips: 100 }) } },
  { id: "arena", nome: "Arena", raridade: "comum", preco: 5,
    descricao: "+2 chips por cada $1 que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ chips: 2 * ctx.state.dinheiro }) } },
  { id: "acrobata", nome: "Acrobata", raridade: "comum", preco: 5,
    descricao: "×3 mult na última mão da rodada",
    ganchos: { aoPontuarMao: (ctx) => (ctx.state.rodada.maosRestantes === 1 ? { xmult: 3 } : null) } },
```

Adicionar ao bloco de Incomuns:

```javascript
  { id: "estencil", nome: "Estêncil", raridade: "incomum", preco: 7,
    descricao: "×mult igual ao número de slots de Coringa vazios + 1",
    // MAX_CORINGAS é 5 (shop.js); literal aqui para não importar shop.js (evita ciclo).
    ganchos: { aoPontuarMao: (ctx) => ({ xmult: (5 - ctx.state.coringas.length) + 1 }) } },
  { id: "abstrato", nome: "Coringa Abstrato", raridade: "incomum", preco: 6,
    descricao: "+3 mult por Coringa que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: 3 * ctx.state.coringas.length }) } },
```

Adicionar ao bloco de Raros:

```javascript
  { id: "coturno", nome: "Coturno", raridade: "raro", preco: 8,
    descricao: "+2 mult por cada $5 que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: 2 * Math.floor(ctx.state.dinheiro / 5) }) } },
```

- [ ] **Step 4: Rodar e verificar que os testes da Task 3 PASSAM**

Run: `node tests/todos.js`
Expected: os 8 testes novos passam. `jokers: 50 coringas` ainda FALHA (agora 43) — esperado.

- [ ] **Step 5: Commit**

```bash
git add js/data/jokers.js tests/scoring.test.js
git commit -m "feat: 11 coringas por-mão (Alegre, Astuto, Arena, Estêncil, Coturno, etc.)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Coringas com estado interno acumulado (5 entradas)

Coringas que mantêm `dados` entre jogadas via `estadoInicial`. Raridades: 4 incomuns (`cartao-fidelidade`, `bode`, `corrida`, `castelo-cartas`) + 1 raro (`campeao`).

**Files:**
- Modify: `js/data/jokers.js`
- Test: `tests/scoring.test.js`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

Adicionar ao fim de `tests/scoring.test.js`:

```javascript
teste("scoring: cartao-fidelidade dá ×4 a cada 6 mãos", () => {
  const c = novoCoringa("cartao-fidelidade");
  const state = stateBase({ coringas: [c] });
  const jogar = () => pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total;
  // mãos 1..5 sem bônus (×1)
  for (let i = 0; i < 5; i++) igual(jogar(), 28 * 2, `mão ${i + 1} sem bônus`);
  // 6ª mão → ×4
  igual(jogar(), 28 * 2 * 4, "6ª mão ativa ×4");
});

teste("scoring: bode acumula sem figura e zera com figura", () => {
  const c = novoCoringa("bode");
  const state = stateBase({ coringas: [c] });
  // 1ª mão sem figura: +1
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * (2 + 1));
  // 2ª mão sem figura: +2
  igual(pontuarJogada(state, [carta("copas", 8), carta("ouros", 8)]).total, (10 + 16) * (2 + 2));
  // 3ª mão COM figura (par de reis): zera, sem bônus
  igual(pontuarJogada(state, [carta("copas", 13), carta("ouros", 13)]).total, 30 * 2);
});

teste("scoring: corrida acumula +15 chips por Sequência", () => {
  const c = novoCoringa("corrida");
  const state = stateBase({ coringas: [c] });
  const seq = () => [
    carta("copas", 5), carta("ouros", 6), carta("paus", 7),
    carta("espadas", 8), carta("copas", 9),
  ];
  // 1ª sequência: dados.chips vira 15; base chips 30+35=65 +15 = 80; mult 4
  igual(pontuarJogada(state, seq()).total, 80 * 4);
  // 2ª sequência: dados.chips vira 30; 65 +30 = 95
  igual(pontuarJogada(state, seq()).total, 95 * 4);
});

teste("scoring: castelo-cartas acumula +4 chips por jogada de 4 cartas", () => {
  const c = novoCoringa("castelo-cartas");
  const state = stateBase({ coringas: [c] });
  // jogada de exatamente 4 cartas (dois pares de 9 e 7 → dois-pares): dados.chips 4
  const cartas4 = () => [carta("copas", 9), carta("ouros", 9), carta("paus", 7), carta("espadas", 7)];
  // dois-pares nível 1: chips 20 + (9+9+7+7)=20+32=52; +4 = 56; mult 2
  igual(pontuarJogada(state, cartas4()).total, 56 * 2);
  // segunda jogada de 4: dados.chips 8
  igual(pontuarJogada(state, cartas4()).total, 60 * 2);
});

teste("scoring: campeao ganha ×0,1 por Quadra", () => {
  const c = novoCoringa("campeao");
  const state = stateBase({ coringas: [c] });
  const quadra = () => [
    carta("copas", 9), carta("ouros", 9), carta("paus", 9), carta("espadas", 9),
  ];
  // 1ª quadra: x vira 1.1; quadra nível 1: chips 60 + 9*4=36 = 96; mult 7 ×1.1 = 7.7
  igual(pontuarJogada(state, quadra()).total, Math.floor(96 * 7.7));
  // 2ª quadra: x vira 1.2
  igual(pontuarJogada(state, quadra()).total, Math.floor(96 * (7 * 1.2)));
});
```

- [ ] **Step 2: Rodar e verificar que FALHAM**

Run: `node tests/todos.js`
Expected: FALHA com TypeError em `novoCoringa("cartao-fidelidade")` (`def` undefined → `def.estadoInicial`).

- [ ] **Step 3: Adicionar as 5 entradas**

Em `js/data/jokers.js`, adicionar ao bloco de Incomuns:

```javascript
  { id: "cartao-fidelidade", nome: "Cartão Fidelidade", raridade: "incomum", preco: 7,
    descricao: "×4 mult a cada 6 mãos jogadas (na 6ª, 12ª, ...)",
    estadoInicial: { contagem: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        ctx.coringa.dados.contagem += 1;
        return ctx.coringa.dados.contagem % 6 === 0 ? { xmult: 4 } : null;
      },
    } },
  { id: "bode", nome: "Bode Expiatório", raridade: "incomum", preco: 6,
    descricao: "+1 mult acumulado por mão sem figura; zera ao jogar uma figura",
    estadoInicial: { mult: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        const dados = ctx.coringa.dados;
        if (ctx.jogada.cartas.some(ehFigura)) { dados.mult = 0; return null; }
        dados.mult += 1;
        return { mult: dados.mult };
      },
    } },
  { id: "corrida", nome: "Corrida", raridade: "incomum", preco: 7,
    descricao: "+15 chips acumulados a cada Sequência jogada",
    estadoInicial: { chips: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (maoContem(ctx.jogada.tipo, "sequencia")) ctx.coringa.dados.chips += 15;
        return { chips: ctx.coringa.dados.chips };
      },
    } },
  { id: "castelo-cartas", nome: "Castelo de Cartas", raridade: "incomum", preco: 6,
    descricao: "+4 chips acumulados sempre que a jogada tem exatamente 4 cartas",
    estadoInicial: { chips: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (ctx.jogada.cartas.length === 4) ctx.coringa.dados.chips += 4;
        return { chips: ctx.coringa.dados.chips };
      },
    } },
```

Adicionar ao bloco de Raros:

```javascript
  { id: "campeao", nome: "Campeão", raridade: "raro", preco: 9,
    descricao: "×mult; ganha +0,1 a cada Quadra jogada",
    estadoInicial: { x: 1 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (ctx.jogada.tipo === "quadra") ctx.coringa.dados.x = +(ctx.coringa.dados.x + 0.1).toFixed(1);
        return { xmult: ctx.coringa.dados.x };
      },
    } },
```

- [ ] **Step 4: Rodar e verificar que os testes da Task 4 PASSAM**

Run: `node tests/todos.js`
Expected: os 5 testes novos passam. `jokers: 50 coringas` ainda FALHA (agora 48) — esperado.

- [ ] **Step 5: Commit**

```bash
git add js/data/jokers.js tests/scoring.test.js
git commit -m "feat: 5 coringas com estado (Fidelidade, Bode, Corrida, Castelo, Campeão)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `coringa-ouro` (fim de rodada) e `misterioso` (aleatório) — fecha o lote

As 2 últimas entradas (48 → 50). `coringa-ouro` é raro e testado em `run.test.js` (dinheiro ao fim da rodada, estilo `foguete`). `misterioso` é incomum e testado por intervalo em `scoring.test.js`.

**Files:**
- Modify: `js/data/jokers.js`
- Test: `tests/run.test.js`, `tests/scoring.test.js`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

Adicionar ao fim de `tests/run.test.js`:

```javascript
teste("run: coringa-ouro paga $4 ao fim da rodada", () => {
  const state = emRodada();
  state.blindAtual.alvo = 10;
  state.dinheiro = 0;
  state.coringas = [novoCoringa("coringa-ouro")];
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  jogar(state, [0, 1]);
  // recompensa da pequena $3 + juros $0 + $4 do coringa-ouro = 7
  igual(state.dinheiro, 7);
});
```

Adicionar ao fim de `tests/scoring.test.js`:

```javascript
teste("scoring: misterioso retorna mult entre 0 e 23", () => {
  // amostra várias seeds; o mult somado fica sempre em [0,23]
  for (let seed = 1; seed <= 30; seed++) {
    const state = stateBase({ coringas: [novoCoringa("misterioso")], rngEstado: seed });
    const { eventos } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
    const ef = eventos.find((e) => e.tipo === "efeito" && e.origem === "misterioso");
    // pode não haver efeito quando o mult sorteado é 0 (suprimido pelo pipeline)
    if (ef) ok(ef.mult >= 1 && ef.mult <= 23, `mult fora do intervalo: ${ef.mult}`);
  }
});
```

- [ ] **Step 2: Rodar e verificar que FALHAM**

Run: `node tests/todos.js`
Expected: FALHA nos dois testes novos (`novoCoringa("coringa-ouro")` / `novoCoringa("misterioso")` → id inexistente).

- [ ] **Step 3: Adicionar as 2 entradas finais**

Em `js/data/jokers.js`, adicionar ao bloco de Incomuns:

```javascript
  { id: "misterioso", nome: "Coringa Misterioso", raridade: "incomum", preco: 6,
    descricao: "+mult aleatório de 0 a 23 a cada mão jogada",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: entre(ctx.state, 0, 23) }) } },
```

Adicionar ao bloco de Raros:

```javascript
  { id: "coringa-ouro", nome: "Coringa de Ouro", raridade: "raro", preco: 8,
    descricao: "Dá $4 ao fim de cada rodada",
    ganchos: { aoFimDaRodada: () => ({ dinheiro: 4 }) } },
```

- [ ] **Step 4: Rodar a suíte completa**

Run: `node tests/todos.js`
Expected: **TODOS verdes**, incluindo `jokers: 50 coringas — 28 comuns, 16 incomuns, 6 raros`. Total esperado ~**113 + 15 novos = ~128 testes, 0 falhas** (o número exato pode variar ±1; o que importa é 0 falhas e o teste de 50 coringas verde).

- [ ] **Step 5: Commit**

```bash
git add js/data/jokers.js tests/run.test.js tests/scoring.test.js
git commit -m "feat: coringa-ouro e misterioso — lote de 25 coringas completo (50 total)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificação final (após Task 5)

- [ ] `node tests/todos.js` → 0 falhas; `jokers: 50 coringas` verde.
- [ ] `grep -c 'id:' js/data/jokers.js` → 50.
- [ ] Conferir visualmente que os 25 novos têm cor distinta na UI (opcional; `corDoCoringa` já deriva do id — sem trabalho).
- [ ] Atualizar `docs/superpowers/plans/PROGRESSO.md` com a frente concluída (data, branch, contagem de testes final).
- [ ] Atualizar a memória `auditoria-paridade.md` marcando "Mais coringas" como feito (25→50) e apontando o próximo item (Aprimoramentos de carta / Edições).
- [ ] Merge `--no-ff` em `main` + push (usuário acompanha pelo deploy).

## Tabela de cobertura spec → tarefa (self-review)

| Spec §3 | Coringa | Task |
|---|---|---|
| 3.1 | steven-par, todd-impar, cara-assustadora, cara-sorridente, erudito, walkie-talkie | Task 2 |
| 3.1 | coringa-alegre, coringa-astuto, coringa-travesso, coringa-diabrete, coringa-malandro, coringa-devoto, arena, acrobata | Task 3 |
| 3.2 | fibonacci | Task 2 |
| 3.2 | estencil, abstrato | Task 3 |
| 3.2 | cartao-fidelidade, bode, corrida, castelo-cartas | Task 4 |
| 3.2 | misterioso | Task 5 |
| 3.3 | coturno | Task 3 |
| 3.3 | campeao | Task 4 |
| 3.3 | coringa-ouro | Task 5 |
| §6 testes | contagem 50 | Task 1 |

**Total: 25 coringas, todos cobertos. 6 comuns + 8 comuns = 14 comuns; 1 + 2 + 4 + 1 = 8 incomuns; 1 + 1 + 1 = 3 raros. ✅**

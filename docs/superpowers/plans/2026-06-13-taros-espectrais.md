# Tarô e Espectrais (efeitos imediatos) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar Tarô (6) e Espectrais (3) como consumíveis de efeito imediato sem alvo, obtidos na loja e em pacotes, sem modificar cartas do baralho.

**Architecture:** Consumíveis passam a ser `{tipo, id}` (tipo ∈ planeta|taro|espectral) num slot compartilhado. Os efeitos vivem em `js/data/taros.js` e `js/data/espectrais.js` como `aplicar(state)` puros-ish (mutam o state via as mesmas operações do engine, usam o RNG com seed). O engine ganha `usarConsumivel` com dispatch e contrato remover-antes-de-aplicar/reinserir-em-erro. Loja e pacotes ganham os novos tipos.

**Tech Stack:** JS puro (ES modules, sem build), harness próprio (`tests/harness.js`), `node tests/todos.js`.

**Convenções:** código/comentários em PT-BR; zero deps; commit termina com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-13-taros-espectrais-design.md`

**IMPORTANTE — testes existentes que QUEBRAM com a mudança `{tipo,id}` e DEVEM ser atualizados nas tasks indicadas (não é escopo extra, é parte do refactor):**
- `tests/run.test.js:165-173` (usa `usarPlaneta` e `consumiveis = ["mercurio"]`) → Task 2.
- `tests/shop.test.js:20, 40, 54, 90-91, 99` (assume tipos só coringa/planeta e `consumiveis` string[]) → Task 3.

---

## Arquivos tocados

- `js/data/taros.js` — **Criar**: 6 Tarôs.
- `js/data/espectrais.js` — **Criar**: 3 Espectrais.
- `tests/consumiveis.test.js` — **Criar**: testes dos efeitos + de `usarConsumivel`.
- `tests/todos.js` — **Modificar**: importar `./consumiveis.test.js`.
- `js/engine/run.js` — **Modificar**: `usarPlaneta` → `usarConsumivel` (dispatch + contrato).
- `js/state.js` — **Modificar**: `VERSAO_SAVE` 1→2; comentário de `consumiveis`.
- `js/ui/render.js` — **Modificar**: chamada `usarConsumivel`; `elementoConsumivel({tipo,id})`.
- `js/engine/shop.js` — **Modificar**: sorteio com novos tipos; 4 pacotes; compra `{tipo,id}`.
- `js/ui/screens.js` — **Modificar**: títulos de pacote; dispatch de elemento.
- `css/cards.css` — **Modificar**: borda por tipo de consumível.
- `tests/run.test.js` — **Modificar**: adaptar teste de `usarPlaneta`→`usarConsumivel`.
- `tests/shop.test.js` — **Modificar**: adaptar asserções de tipo/consumível.

---

## Task 1: dados dos Tarôs e Espectrais + testes de efeito

**Files:**
- Create: `js/data/taros.js`, `js/data/espectrais.js`
- Create: `tests/consumiveis.test.js`
- Modify: `tests/todos.js`

Contexto: cada consumível é `{ id, nome, descricao, preco, aplicar(state) }`. `aplicar`
muta o state e devolve `{}` em sucesso ou `{ erro }` se faltar recurso. Usa
`escolher`/`proximoAleatorio` de `engine/rng.js` para aleatoriedade (determinístico por
seed). Reusa `precoVenda` de `engine/economy.js` (A Temperança) e o sorteio de Coringa
por raridade. Para evitar duplicar a lógica de "criar Coringa de raridade R disponível",
esta task adiciona um helper exportado em `js/engine/shop.js`.

Limites e constantes (de `js/engine/shop.js`): `MAX_CORINGAS = 5`, `MAX_CONSUMIVEIS = 2`.
Raridades de Coringa: "comum" (14), "incomum" (8), "raro" (3) — ver `js/data/jokers.js`.

> **Import circular intencional e seguro:** `taros.js`/`espectrais.js` importam
> `criarCoringaDe` de `shop.js`, e (na Task 3) `shop.js` importa `TAROS`/`ESPECTRAIS`
> desses módulos. O ciclo é resolvido pelos ES modules porque `criarCoringaDe` só é
> **chamada** dentro de `aplicar` (em tempo de execução), nunca no corpo do módulo (tempo
> de avaliação). Verificado: funciona. Não "consertar" movendo coisas — é o padrão
> esperado aqui.

- [ ] **Step 1: Adicionar helper de criação de Coringa em `js/engine/shop.js`**

Hoje `shop.js` tem `coringasDisponiveis(state, raridade)` (privado) e `adicionarCoringa`.
Exportar uma função que os consumíveis reusam para criar um Coringa de uma raridade. No
fim de `coringasDisponiveis` (que já existe), adicionar **após** a função `adicionarCoringa`:

```js
// Cria um Coringa aleatório de uma raridade no slot, se houver espaço e opção.
// Reusado por Tarôs/Espectrais. Devolve {} ou { erro }.
export function criarCoringaDe(state, raridade) {
  if (state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
  const opcoes = coringasDisponiveis(state, raridade);
  if (!opcoes.length) return { erro: "vazio" };
  adicionarCoringa(state, escolher(state, opcoes).id);
  return {};
}
```

`escolher` já está importado no topo de `shop.js` (`import { proximoAleatorio, escolher } from "./rng.js";`). `coringasDisponiveis` e `adicionarCoringa` já existem no arquivo.

- [ ] **Step 2: Escrever os testes que falham (`tests/consumiveis.test.js`)**

```js
import { teste, ok, igual } from "./harness.js";
import { criarRun } from "../js/state.js";
import { TAROS } from "../js/data/taros.js";
import { ESPECTRAIS } from "../js/data/espectrais.js";
import { novoCoringa, CORINGAS } from "../js/data/jokers.js";
import { MAX_CORINGAS } from "../js/engine/shop.js";

teste("taros: O Mundo dá +$20", () => {
  const state = criarRun(1);
  const antes = state.dinheiro;
  igual(TAROS["o-mundo"].aplicar(state), {});
  igual(state.dinheiro, antes + 20);
});

teste("taros: A Estrela sobe 1 nível de uma mão (determinístico)", () => {
  const state = criarRun(1);
  const total = () => Object.values(state.niveisMaos).reduce((a, b) => a + b, 0);
  const antes = total();
  igual(TAROS["a-estrela"].aplicar(state), {});
  igual(total(), antes + 1, "exatamente um nível subiu");
});

teste("taros: A Lua cria um Planeta no slot", () => {
  const state = criarRun(1);
  igual(TAROS["a-lua"].aplicar(state), {});
  igual(state.consumiveis.length, 1);
  igual(state.consumiveis[0].tipo, "planeta");
});

teste("taros: O Diabo cria um Coringa comum; sem slot dá erro", () => {
  const state = criarRun(1);
  igual(TAROS["o-diabo"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "comum");
  // lota os slots e tenta de novo
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(TAROS["o-diabo"].aplicar(state).erro, "sem-espaco");
});

teste("taros: A Roda cria incomum ou dá +$5 (nunca falha)", () => {
  const state = criarRun(2);
  const r = TAROS["a-roda"].aplicar(state);
  igual(r, {}, "nunca retorna erro");
  ok(state.coringas.length === 1 || state.dinheiro >= 4, "criou coringa ou ganhou dinheiro");
});

teste("taros: A Temperança paga venda dos coringas (teto 20)", () => {
  const state = criarRun(1);
  state.dinheiro = 0;
  state.coringas = [];
  igual(TAROS["a-temperanca"].aplicar(state), {});
  igual(state.dinheiro, 0, "0 coringas → +0");
  // coringa preço 3 → venda 1 (precoVenda) ; checa que soma algo com coringas
  state.coringas = [novoCoringa("coringa"), novoCoringa("ganancioso")];
  const antes = state.dinheiro;
  igual(TAROS["a-temperanca"].aplicar(state), {});
  ok(state.dinheiro > antes, "soma valor de venda");
  ok(state.dinheiro - antes <= 20, "teto de 20");
});

teste("espectrais: Aether sobe 2 níveis", () => {
  const state = criarRun(1);
  const total = () => Object.values(state.niveisMaos).reduce((a, b) => a + b, 0);
  const antes = total();
  igual(ESPECTRAIS["aether"].aplicar(state), {});
  igual(total(), antes + 2);
});

teste("espectrais: Séance cria Coringa raro; sem slot dá erro", () => {
  const state = criarRun(1);
  igual(ESPECTRAIS["seance"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "raro");
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(ESPECTRAIS["seance"].aplicar(state).erro, "sem-espaco");
});

teste("espectrais: Wraith cria raro e zera dinheiro; sem slot não zera", () => {
  const state = criarRun(1);
  state.dinheiro = 30;
  igual(ESPECTRAIS["wraith"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "raro");
  igual(state.dinheiro, 0, "zera ao criar");
  // sem slot: não zera
  state.dinheiro = 30;
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(ESPECTRAIS["wraith"].aplicar(state).erro, "sem-espaco");
  igual(state.dinheiro, 30, "falha antes de zerar");
});
```

E adicionar a `tests/todos.js`, logo após `import "./run.test.js";`:

```js
import "./consumiveis.test.js";
```

- [ ] **Step 3: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "taros|espectrais|Cannot|falha"`
Esperado: erro de módulo ausente (`../js/data/taros.js`) ou funções indefinidas.

- [ ] **Step 4: Criar `js/data/taros.js`**

```js
import { escolher, proximoAleatorio } from "../engine/rng.js";
import { MAOS } from "./hands.js";
import { PLANETAS } from "./planets.js";
import { precoVenda } from "../engine/economy.js";
import { criarCoringaDe } from "../engine/shop.js";

const PRECO_TARO = 3;

function subirMaoAleatoria(state, vezes) {
  for (let i = 0; i < vezes; i++) {
    const mao = escolher(state, Object.keys(MAOS));
    state.niveisMaos[mao] += 1;
  }
}

const LISTA = [
  { id: "o-mundo", nome: "O Mundo", descricao: "Ganha $20.",
    aplicar: (state) => { state.dinheiro += 20; return {}; } },
  { id: "a-estrela", nome: "A Estrela", descricao: "Sobe 1 nível de uma mão aleatória.",
    aplicar: (state) => { subirMaoAleatoria(state, 1); return {}; } },
  { id: "a-lua", nome: "A Lua", descricao: "Cria 1 Planeta aleatório.",
    aplicar: (state) => {
      const id = escolher(state, Object.keys(PLANETAS));
      state.consumiveis.push({ tipo: "planeta", id });
      return {};
    } },
  { id: "o-diabo", nome: "O Diabo", descricao: "Cria 1 Coringa comum.",
    aplicar: (state) => criarCoringaDe(state, "comum") },
  { id: "a-roda", nome: "A Roda da Fortuna", descricao: "Chance de criar um Coringa incomum; senão +$5.",
    aplicar: (state) => {
      if (proximoAleatorio(state) < 0.5) {
        const r = criarCoringaDe(state, "incomum");
        if (!r.erro) return {};
      }
      state.dinheiro += 5;
      return {};
    } },
  { id: "a-temperanca", nome: "A Temperança", descricao: "Ganha o valor de venda dos seus Coringas (máx. $20).",
    aplicar: (state) => {
      const soma = state.coringas.reduce((acc, c) => acc + precoVenda(c.def.preco), 0);
      state.dinheiro += Math.min(20, soma);
      return {};
    } },
];

export const TAROS = Object.fromEntries(LISTA.map((t) => [t.id, { ...t, preco: PRECO_TARO }]));
```

> Nota sobre A Lua e o slot: o engine (Task 2) remove o consumível usado ANTES de chamar
> `aplicar`, então quando A Lua roda há sempre ≥1 vaga. Por isso `aplicar` da Lua só faz
> `push` — não precisa checar espaço. O teste de A Lua na Task 1 chama `aplicar`
> diretamente (sem passar pelo engine) num state com `consumiveis: []`, então o push cabe.

- [ ] **Step 5: Criar `js/data/espectrais.js`**

```js
import { escolher } from "../engine/rng.js";
import { MAOS } from "./hands.js";
import { criarCoringaDe } from "../engine/shop.js";

const PRECO_ESPECTRAL = 4;

const LISTA = [
  { id: "aether", nome: "Aether", descricao: "Sobe 2 níveis de uma mão aleatória.",
    aplicar: (state) => {
      for (let i = 0; i < 2; i++) state.niveisMaos[escolher(state, Object.keys(MAOS))] += 1;
      return {};
    } },
  { id: "seance", nome: "Séance", descricao: "Cria 1 Coringa raro.",
    aplicar: (state) => criarCoringaDe(state, "raro") },
  { id: "wraith", nome: "Wraith", descricao: "Cria 1 Coringa raro, mas zera seu dinheiro.",
    aplicar: (state) => {
      const r = criarCoringaDe(state, "raro");
      if (r.erro) return r;       // falha antes de zerar
      state.dinheiro = 0;
      return {};
    } },
];

export const ESPECTRAIS = Object.fromEntries(LISTA.map((e) => [e.id, { ...e, preco: PRECO_ESPECTRAL }]));
```

- [ ] **Step 6: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `90 teste(s), 0 falha(s)` (81 anteriores + 9 novos).

> Se o número divergir por 1-2, confirme que cada `teste(...)` novo está contando; o que
> importa é +9 e 0 falhas.

- [ ] **Step 7: Commit**

```bash
git add js/data/taros.js js/data/espectrais.js js/engine/shop.js tests/consumiveis.test.js tests/todos.js
git commit -m "feat: dados de Tarô e Espectrais + helper criarCoringaDe (milestone #2)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: engine `usarConsumivel` (dispatch + contrato) + migração do save

**Files:**
- Modify: `js/engine/run.js`
- Modify: `js/state.js`
- Modify: `js/ui/render.js`
- Modify: `tests/run.test.js`

Contexto: `usarPlaneta(state, indice)` hoje assume que `state.consumiveis[indice]` é um ID
de planeta (string). Vira `usarConsumivel` com dispatch por `{tipo}`. Contrato para
taro/espectral: remove o slot ANTES de `aplicar`; se erro, reinsere na posição original.
`VERSAO_SAVE` vai a 2 (saves v1 descartados pelo `carregar` existente).

A função atual (js/engine/run.js, linhas ~148-157) é:

```js
export function usarPlaneta(state, indice) {
  const planetaId = state.consumiveis[indice];
  if (!planetaId) return { erro: "slot-vazio" };
  state.consumiveis.splice(indice, 1);
  state.niveisMaos[PLANETAS[planetaId].mao] += 1;
  for (const coringa of state.coringas) {
    coringa.def.ganchos.aoUsarPlaneta?.({ state, coringa });
  }
  return {};
}
```

- [ ] **Step 1: Atualizar o teste em `tests/run.test.js`**

Trocar o import na linha 5 (`usarPlaneta` → `usarConsumivel`):

```js
import {
  iniciarBlind, pularBlind, jogar, descartar, ordenarMao, usarConsumivel,
  TAMANHO_MAO, MAOS_POR_BLIND, DESCARTES_POR_BLIND,
} from "../js/engine/run.js";
```

Substituir o teste (linhas 165-174) por:

```js
teste("run: usarConsumivel (planeta) sobe o nível e avisa a constelação", () => {
  const state = emRodada();
  state.coringas = [novoCoringa("constelacao")];
  state.consumiveis = [{ tipo: "planeta", id: "mercurio" }];
  igual(usarConsumivel(state, 0), {});
  igual(state.niveisMaos["par"], 2);
  igual(state.consumiveis, []);
  igual(state.coringas[0].dados.x, 1.1);
  igual(usarConsumivel(state, 0).erro, "slot-vazio");
});

teste("run: usarConsumivel (taro/espectral) — sucesso gasta, erro reinsere", () => {
  const state = emRodada();
  state.consumiveis = [{ tipo: "taro", id: "o-mundo" }];
  const antes = state.dinheiro;
  igual(usarConsumivel(state, 0), {});
  igual(state.dinheiro, antes + 20);
  igual(state.consumiveis, [], "sucesso remove o slot");

  // erro reinsere: Séance sem slot de coringa
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  state.consumiveis = [{ tipo: "espectral", id: "seance" }];
  igual(usarConsumivel(state, 0).erro, "sem-espaco");
  igual(state.consumiveis, [{ tipo: "espectral", id: "seance" }], "erro mantém o slot");
});
```

(`novoCoringa` já está importado no topo de run.test.js.)

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "usarConsumivel|Cannot|falha"`
Esperado: falha (`usarConsumivel` não exportado).

- [ ] **Step 3: Implementar `usarConsumivel` em `js/engine/run.js`**

Adicionar os imports de dados no topo de `run.js`. Hoje há
`import { PLANETAS } from "../data/planets.js";`. Acrescentar logo abaixo:

```js
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
```

Substituir a função `usarPlaneta` inteira por:

```js
export function usarConsumivel(state, indice) {
  const item = state.consumiveis[indice];
  if (!item) return { erro: "slot-vazio" };

  if (item.tipo === "planeta") {
    state.consumiveis.splice(indice, 1);
    state.niveisMaos[PLANETAS[item.id].mao] += 1;
    for (const coringa of state.coringas) {
      coringa.def.ganchos.aoUsarPlaneta?.({ state, coringa });
    }
    return {};
  }

  // Tarô/Espectral: remove o slot antes de aplicar (libera vaga p/ A Lua);
  // se aplicar falhar, reinsere o consumível na posição original.
  const def = item.tipo === "taro" ? TAROS[item.id] : ESPECTRAIS[item.id];
  state.consumiveis.splice(indice, 1);
  const resultado = def.aplicar(state);
  if (resultado.erro) {
    state.consumiveis.splice(indice, 0, item);
    return resultado;
  }
  return {};
}
```

- [ ] **Step 4: Atualizar o chamador em `js/ui/render.js`**

Trocar o import (linha 7) de `usarPlaneta` para `usarConsumivel`:

```js
import { usarConsumivel } from "../engine/run.js";
```

E a chamada dentro de `elementoConsumivel` (hoje `usarPlaneta(app.state, indice);`) por:

```js
      usarConsumivel(app.state, indice);
```

(A assinatura de `elementoConsumivel` muda na Task 4; aqui só troca a função chamada.)

- [ ] **Step 5: Bumpar `VERSAO_SAVE` e o comentário em `js/state.js`**

Trocar `export const VERSAO_SAVE = 1;` por:

```js
export const VERSAO_SAVE = 2;
```

E o comentário da linha de `consumiveis` em `criarRun` (hoje `consumiveis: [],  // ids de planetas (máx. 2)`):

```js
    consumiveis: [],  // { tipo: "planeta"|"taro"|"espectral", id } — máx. 2
```

- [ ] **Step 6: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `91 teste(s), 0 falha(s)` (90 + 1 teste novo de usarConsumivel; o antigo de
usarPlaneta foi reescrito, não somado).

> O total exato pode variar ±1 conforme contagem; o essencial: 0 falhas e o novo teste
> de taro/espectral presente.

- [ ] **Step 7: Commit**

```bash
git add js/engine/run.js js/state.js js/ui/render.js tests/run.test.js
git commit -m "feat: usarConsumivel com dispatch por tipo; VERSAO_SAVE 2 (milestone #2)

Renomeia usarPlaneta para usarConsumivel: planeta sobe nível; taro/espectral chamam
aplicar com contrato remover-antes/reinserir-em-erro. consumiveis agora {tipo,id}.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: loja e pacotes com os novos tipos

**Files:**
- Modify: `js/engine/shop.js`
- Modify: `tests/shop.test.js`

Contexto: `sortearItem` (hoje 30% planeta, senão coringa) ganha Tarô/Espectral.
`comprarItem` precisa aceitar `taro`/`espectral` no check de slot e no push `{tipo,id}`.
`comprarPacote` ganha 4 tipos; `escolherDoPacote` faz dispatch.

- [ ] **Step 1: Atualizar os testes existentes que assumem só coringa/planeta em `tests/shop.test.js`**

(a) Teste "gera 2 itens válidos" (linha ~16-23) — ampliar tipos aceitos:

```js
teste("shop: gera 2 itens válidos", () => {
  const state = comLoja();
  igual(state.loja.itens.length, 2);
  const tipos = ["coringa", "planeta", "taro", "espectral"];
  for (const item of state.loja.itens) {
    ok(tipos.includes(item.tipo), `tipo inválido: ${item.tipo}`);
    ok(item.preco > 0);
  }
});
```

(b) Teste "comprar planeta vai para os consumíveis" (linha ~36-41) — `consumiveis` agora `{tipo,id}`:

```js
teste("shop: comprar planeta vai para os consumíveis", () => {
  const state = comLoja();
  state.loja.itens[0] = { tipo: "planeta", id: "mercurio", preco: 3 };
  igual(comprarItem(state, 0), {});
  igual(state.consumiveis, [{ tipo: "planeta", id: "mercurio" }]);
});
```

(c) No teste "sem-dinheiro/sem-espaço" (linha ~53-55), trocar o array de consumíveis:

```js
  state.loja.itens[1] = { tipo: "planeta", id: "venus", preco: 3 };
  state.consumiveis = [{ tipo: "planeta", id: "plutao" }, { tipo: "planeta", id: "marte" }];
  igual(comprarItem(state, 1).erro, "sem-espaco");
```

(d) Teste do pacote (linha ~84-101) — aceitar 4 tipos e checar consumível `{tipo,id}`:

```js
teste("shop: pacote abre opções e escolher devolve à loja", () => {
  const state = comLoja();
  const dinheiroAntes = state.dinheiro;
  igual(comprarPacote(state), {});
  igual(state.dinheiro, dinheiroAntes - PRECO_PACOTE);
  igual(state.fase, "pacote");
  ok(["planeta", "coringa", "taro", "espectral"].includes(state.pacote.tipo));
  const tresOpcoes = state.pacote.tipo === "planeta" || state.pacote.tipo === "taro";
  const esperado = tresOpcoes ? 3 : 2;
  igual(state.pacote.opcoes.length, esperado);
  igual(new Set(state.pacote.opcoes).size, esperado, "opções únicas");

  const tipo = state.pacote.tipo;
  igual(escolherDoPacote(state, 0), {});
  igual(state.fase, "loja");
  igual(state.pacote, null);
  if (tipo === "coringa") igual(state.coringas.length, 1);
  else igual(state.consumiveis.length, 1);
  igual(comprarPacote(state).erro, "ja-aberto", "um pacote por visita");
});
```

- [ ] **Step 2: Rodar e confirmar que FALHA (os testes adaptados acusam o código antigo)**

Run: `node tests/todos.js 2>&1 | grep -E "shop|falha"`
Esperado: falhas em shop (consumível ainda é string; pacote só 2 tipos), confirmando que
o código precisa mudar. Algumas asserções podem passar por acaso conforme o sorteio —
rode 2-3 vezes; o ponto é que o código ainda não suporta `{tipo,id}` nos consumíveis.

- [ ] **Step 3: Adicionar sorteio de Tarô/Espectral em `js/engine/shop.js`**

No topo, ampliar os imports de dados. Hoje há
`import { PLANETAS, PRECO_PLANETA } from "../data/planets.js";`. Acrescentar:

```js
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
```

Adicionar helpers de sorteio (junto aos `sortearPlaneta`/`sortearCoringa` existentes):

```js
function sortearTaro(state) {
  const def = escolher(state, Object.values(TAROS));
  return { tipo: "taro", id: def.id, preco: def.preco };
}

function sortearEspectral(state) {
  const def = escolher(state, Object.values(ESPECTRAIS));
  return { tipo: "espectral", id: def.id, preco: def.preco };
}
```

Substituir `sortearItem` (hoje 30% planeta, senão coringa) por pesos 45/25/22/8:

```js
function sortearItem(state) {
  const r = proximoAleatorio(state);
  if (r < 0.45) return sortearCoringa(state) || sortearPlaneta(state);
  if (r < 0.70) return sortearPlaneta(state);
  if (r < 0.92) return sortearTaro(state);
  return sortearEspectral(state);
}
```

- [ ] **Step 4: Aceitar taro/espectral em `comprarItem`**

Hoje `comprarItem` tem checks de slot por tipo (linhas ~68-69) e o push (linhas ~73-74).
Substituir o corpo a partir do check de espaço por:

```js
  if (item.tipo === "coringa" && state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
  if (item.tipo !== "coringa" && state.consumiveis.length >= MAX_CONSUMIVEIS) return { erro: "sem-espaco" };

  state.dinheiro -= item.preco;
  state.loja.itens[indice] = null;
  if (item.tipo === "coringa") adicionarCoringa(state, item.id);
  else state.consumiveis.push({ tipo: item.tipo, id: item.id });
  return {};
```

- [ ] **Step 5: 4 tipos de pacote em `comprarPacote` + dispatch em `escolherDoPacote`**

Substituir o miolo de `comprarPacote` (o bloco `if (proximoAleatorio(state) < 0.5) {...}
else {...}`) por um sorteio de 4 tipos (Celestial 30%, Coringas 30%, Arcano 30%,
Espectral 10%):

```js
  const r = proximoAleatorio(state);
  if (r < 0.30) {
    state.pacote = { tipo: "planeta", opcoes: sortearOpcoesUnicas(state, Object.keys(PLANETAS), 3) };
  } else if (r < 0.60) {
    const opcoes = [];
    let tentativas = 0;
    while (opcoes.length < 2 && tentativas++ < 50) {
      const sorteado = sortearCoringa(state);
      if (!sorteado) break;
      if (!opcoes.includes(sorteado.id)) opcoes.push(sorteado.id);
    }
    state.pacote = { tipo: "coringa", opcoes };
  } else if (r < 0.90) {
    state.pacote = { tipo: "taro", opcoes: sortearOpcoesUnicas(state, Object.keys(TAROS), 3) };
  } else {
    state.pacote = { tipo: "espectral", opcoes: sortearOpcoesUnicas(state, Object.keys(ESPECTRAIS), 2) };
  }
  state.fase = "pacote";
  return {};
```

E adicionar o helper `sortearOpcoesUnicas` (antes de `comprarPacote`), que generaliza o
laço de opções únicas que o pacote de planeta já fazia:

```js
// Sorteia N ids únicos de uma lista (para opções de pacote). Para se a lista for menor.
function sortearOpcoesUnicas(state, ids, n) {
  const opcoes = [];
  let tentativas = 0;
  while (opcoes.length < Math.min(n, ids.length) && tentativas++ < 100) {
    const id = escolher(state, ids);
    if (!opcoes.includes(id)) opcoes.push(id);
  }
  return opcoes;
}
```

Substituir `escolherDoPacote` por dispatch (coringa via `adicionarCoringa`; demais como
`{tipo,id}`):

```js
export function escolherDoPacote(state, indice) {
  const id = state.pacote.opcoes[indice];
  if (state.pacote.tipo === "coringa") {
    if (state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
    adicionarCoringa(state, id);
  } else {
    if (state.consumiveis.length >= MAX_CONSUMIVEIS) return { erro: "sem-espaco" };
    state.consumiveis.push({ tipo: state.pacote.tipo, id });
  }
  state.pacote = null;
  state.fase = "loja";
  return {};
}
```

- [ ] **Step 6: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `91 teste(s), 0 falha(s)` (sem testes somados nesta task; só adaptados).

- [ ] **Step 7: Commit**

```bash
git add js/engine/shop.js tests/shop.test.js
git commit -m "feat: loja e pacotes incluem Tarô e Espectrais (milestone #2)

sortearItem com pesos 45/25/22/8; comprarPacote com 4 tipos; consumiveis {tipo,id}.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: UI — render de consumível por tipo, títulos de pacote, CSS

**Files:**
- Modify: `js/ui/render.js`
- Modify: `js/ui/screens.js`
- Modify: `css/cards.css`

Contexto: `elementoConsumivel(planetaId, indice)` hoje recebe um ID de planeta (string).
Passa a receber `{tipo, id}` e fazer dispatch de rótulo/tooltip. `cartaoItem` e
`renderPacote` passam a montar o elemento por tipo. Mudança puramente de UI; sem teste
de engine novo (verificação manual).

A função atual em `js/ui/render.js` (a partir da assinatura) é:

```js
export function elementoConsumivel(planetaId, indice = null) {
  const planeta = PLANETAS[planetaId];
  const elemento = el("div", { classe: "consumivel" }, el("span", {}, planeta.nome));
  const nivel = app.state ? app.state.niveisMaos[planeta.mao] : 1;
  ligarTooltip(elemento,
    `<strong>${planeta.nome}</strong><br>Sobe o nível de ${MAOS[planeta.mao].nome} (nível atual: ${nivel})`);
  if (indice !== null) {
    elemento.addEventListener("click", () => {
      usarConsumivel(app.state, indice);
      atualizar();
    });
  }
  return elemento;
}
```

- [ ] **Step 1: Generalizar `elementoConsumivel` em `js/ui/render.js`**

Adicionar imports de dados no topo de `render.js`. Hoje há
`import { PLANETAS } from "../data/planets.js";`. Acrescentar:

```js
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
```

Substituir `elementoConsumivel` por:

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
  ligarTooltip(elemento, `<strong>${nome}</strong><br>${descricaoHtml}`);
  if (indice !== null) {
    elemento.addEventListener("click", () => {
      usarConsumivel(app.state, indice);
      atualizar();
    });
  }
  return elemento;
}
```

E atualizar `fileiraConsumiveis` (hoje passa `id` string). Hoje é:

```js
export function fileiraConsumiveis(state) {
  const fileira = el("div", { classe: "consumiveis" });
  state.consumiveis.forEach((id, i) => fileira.append(elementoConsumivel(id, i)));
  ...
```

Trocar o forEach para passar o objeto `{tipo,id}` direto:

```js
  state.consumiveis.forEach((consumivel, i) => fileira.append(elementoConsumivel(consumivel, i)));
```

(O resto de `fileiraConsumiveis`, com os slots vazios, fica igual.)

- [ ] **Step 2: Atualizar `cartaoItem` e `renderPacote` em `js/ui/screens.js`**

`cartaoItem` (hoje monta `elementoConsumivel(item.id)` para não-coringa). Trocar para
passar `{tipo,id}`:

```js
function cartaoItem(state, item, indice) {
  const corpo = item.tipo === "coringa"
    ? elementoCoringa(novoCoringa(item.id))
    : elementoConsumivel({ tipo: item.tipo, id: item.id });
  return el("div", { classe: "cartao-item" },
    corpo,
    el("button", {
      classe: "botao botao-azul",
      onclick: () => { const r = comprarItem(state, indice); if (r.erro) avisar(r.erro); else atualizar(); },
    }, `Comprar $${item.preco}`),
  );
}
```

`renderPacote` (hoje título binário e elemento por tipo planeta/coringa). Substituir por
título dos 4 tipos e dispatch:

```js
const TITULO_PACOTE = {
  planeta: "Pacote Celestial",
  coringa: "Pacote de Coringas",
  taro: "Pacote Arcano",
  espectral: "Pacote Espectral",
};

function renderPacote(state) {
  const secao = secaoDe("pacote");
  const tipo = state.pacote.tipo;
  secao.replaceChildren(
    el("h2", { classe: "logo" }, TITULO_PACOTE[tipo]),
    el("p", { classe: "subtitulo" }, "Escolha 1"),
    el("div", { classe: "itens-loja" },
      ...state.pacote.opcoes.map((id, i) =>
        el("div", { classe: "cartao-item" },
          tipo === "coringa" ? elementoCoringa(novoCoringa(id)) : elementoConsumivel({ tipo, id }),
          el("button", {
            classe: "botao botao-azul",
            onclick: () => { const r = escolherDoPacote(state, i); if (r.erro) avisar(r.erro); else atualizar(); },
          }, "Escolher"),
        ),
      ),
    ),
    el("button", { classe: "botao", onclick: () => { pularPacote(state); atualizar(); } }, "Pular"),
  );
}
```

- [ ] **Step 3: Borda por tipo em `css/cards.css`**

`.consumivel` já tem `border: 2px solid #3e7ca6;` (css/cards.css:88-91). Os três
modificadores abaixo só sobrescrevem a cor da borda por tipo. Adicionar ao FIM de
`css/cards.css` (tarô roxo, espectral azul-claro; planeta mantém o azul atual mas
declaramos explícito para consistência):

```css
.consumivel--planeta { border-color: var(--azul); }
.consumivel--taro { border-color: #b072d6; }
.consumivel--espectral { border-color: #6fe0ff; }
```

- [ ] **Step 4: Rodar a suíte (nada de engine quebrou)**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `91 teste(s), 0 falha(s)`.

- [ ] **Step 5: Smoke headless (módulos de UI carregam)**

```bash
node --input-type=module -e '
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => { const e={ className:"", setAttribute(){}, append(){}, addEventListener(){}, classList:{add(){},remove(){}}, style:{}, dataset:{} }; return e; }, body:{ append(){} } };
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const r = await import("./js/ui/render.js");
const s = await import("./js/ui/screens.js");
if (typeof r.elementoConsumivel !== "function") { console.error("elementoConsumivel ausente"); process.exit(1); }
console.log("OK render.js e screens.js carregam");
'
```
Esperado: `OK render.js e screens.js carregam`.

- [ ] **Step 6: Verificação manual (anotar, não bloqueia)**

Servir e confirmar: Tarô/Espectral aparecem na loja e em pacotes; comprar e usar aplica
efeito; tooltip mostra a descrição; borda colorida por tipo. Sem browser aqui → pendência
visual.

- [ ] **Step 7: Commit**

```bash
git add js/ui/render.js js/ui/screens.js css/cards.css
git commit -m "feat: UI de Tarô e Espectrais (render, pacotes, cores) (milestone #2)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `91 teste(s), 0 falha(s)`.

Run: `grep -rn "usarPlaneta" js/` → Esperado: nenhuma ocorrência (renomeado por completo).

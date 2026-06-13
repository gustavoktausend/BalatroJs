# Seed compartilhável — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir iniciar uma run com uma seed escolhida (código curto base36) e exibir o código da seed da run atual, tornando runs reproduzíveis e compartilháveis.

**Architecture:** Novo módulo puro `js/engine/seed.js` com `codificarSeed`/`decodificarSeed` (número ↔ código `[A-Z0-9]` de 6 chars), testado em Node. A UI ganha um input na tela de título e a exibição do código no `cabecalhoRun`. `criarRun`/RNG não mudam.

**Tech Stack:** JS puro (ES modules, sem build). Harness próprio (`tests/harness.js`), rodado com `node tests/todos.js`.

**Convenções:** código/comentários em PT-BR; zero deps; commit termina com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Spec:** `docs/superpowers/specs/2026-06-13-seed-compartilhavel-design.md`

**Pré-requisito de fato (já existente):** `criarRun(semente = Date.now() % 2 ** 31)` em `js/state.js` aceita uma semente e a guarda em `state.semente`; o save persiste `semente`. Sementes válidas: inteiros `0 … 2³¹−1`.

---

## Arquivos tocados

- `js/engine/seed.js` — **Criar**: `codificarSeed`, `decodificarSeed`.
- `tests/seed.test.js` — **Criar**: testes round-trip / case / inválidos.
- `tests/todos.js` — **Modificar**: importar `./seed.test.js`.
- `js/ui/screens.js` — **Modificar**: `renderTitulo` ganha input de seed.
- `js/ui/render.js` — **Modificar**: `cabecalhoRun` mostra a seed; nova mensagem `seed-invalida`.

---

## Task 1: módulo `js/engine/seed.js` + testes

**Files:**
- Create: `js/engine/seed.js`
- Create: `tests/seed.test.js`
- Modify: `tests/todos.js`

Contexto: `codificarSeed(n)` → base36 maiúsculo com padding `0` até 6 chars (`2³¹−1` =
`ZIK0ZJ`, 6 chars). `decodificarSeed(c)` → inteiro válido ou `null`; normaliza (trim +
maiúsculo), valida `^[A-Z0-9]+$`, e rejeita resultado fora de `0 … 2³¹−1`. Nunca lança.
Caso-limite importante: `"ZZZZZZ"` é `[A-Z0-9]` válido mas decodifica para 2176782335 >
2³¹−1 → deve dar `null`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/seed.test.js`:

```js
import { teste, ok, igual } from "./harness.js";
import { codificarSeed, decodificarSeed } from "../js/engine/seed.js";

const MAX = 2 ** 31 - 1;

teste("seed: round-trip decodificar(codificar(n)) === n", () => {
  for (const n of [0, 1, 1837465021, MAX]) {
    igual(decodificarSeed(codificarSeed(n)), n, `round-trip ${n}`);
  }
});

teste("seed: codificarSeed é estável, maiúsculo, 6 chars [A-Z0-9]", () => {
  igual(codificarSeed(1837465021), "UDZ931");
  igual(codificarSeed(1), "000001", "padding à esquerda");
  igual(codificarSeed(MAX), "ZIK0ZJ");
  ok(/^[A-Z0-9]{6}$/.test(codificarSeed(0)), "só A-Z0-9, 6 chars");
});

teste("seed: decodificarSeed é case-insensitive e ignora espaços nas pontas", () => {
  igual(decodificarSeed("udz931"), 1837465021, "minúsculas");
  igual(decodificarSeed("  UDZ931  "), 1837465021, "trim");
});

teste("seed: decodificarSeed rejeita inválidos com null", () => {
  igual(decodificarSeed(""), null, "vazio");
  igual(decodificarSeed("   "), null, "só espaços");
  igual(decodificarSeed("abc!@#"), null, "caractere inválido");
  igual(decodificarSeed("ZZZZZZ"), null, "válido em A-Z0-9 mas acima de 2^31-1");
  igual(decodificarSeed(123), null, "entrada não-string");
});
```

Adicionar a linha de import em `tests/todos.js`, logo após `import "./run.test.js";`:

```js
import "./seed.test.js";
```

- [ ] **Step 2: Rodar e confirmar que FALHA**

Run: `node tests/todos.js 2>&1 | grep -E "seed|falha"`
Esperado: falha (`Cannot find module ../js/engine/seed.js` ou funções indefinidas).

- [ ] **Step 3: Implementar `js/engine/seed.js`**

Criar `js/engine/seed.js`:

```js
// Conversão entre a semente numérica interna (0 … 2^31-1) e um código curto
// base36 maiúsculo (6 chars), legível e fácil de compartilhar/ditar.

const MAX_SEMENTE = 2 ** 31 - 1;

export function codificarSeed(semente) {
  return semente.toString(36).toUpperCase().padStart(6, "0");
}

// Retorna o inteiro da seed, ou null se o código for inválido. Nunca lança.
export function decodificarSeed(codigo) {
  if (typeof codigo !== "string") return null;
  const texto = codigo.trim().toUpperCase();
  if (!texto || !/^[A-Z0-9]+$/.test(texto)) return null;
  const n = parseInt(texto, 36);
  if (!Number.isInteger(n) || n < 0 || n > MAX_SEMENTE) return null;
  return n;
}
```

- [ ] **Step 4: Rodar e confirmar que PASSA**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: `80 teste(s), 0 falha(s)` (76 anteriores + 4 novos).

> Nota: o total base depende de o plano do fundo animado já ter sido executado (76) ou
> não (72). Se o fundo ainda não foi feito, o esperado é `76 teste(s), 0 falha(s)`
> (72 + 4). O que importa: +4 testes em relação ao baseline atual, 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/engine/seed.js tests/seed.test.js tests/todos.js
git commit -m "feat: módulo seed (codificar/decodificar base36) + testes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: input de seed no título + exibição no cabeçalho

**Files:**
- Modify: `js/ui/screens.js` (`renderTitulo`)
- Modify: `js/ui/render.js` (`cabecalhoRun` + `MENSAGENS`)

Contexto: `renderTitulo` hoje cria run com `criarRun()` (semente aleatória). Vamos
adicionar um `<input id="campo-seed">`; ao "Jogar", se o input estiver preenchido e
válido, usar `criarRun(decodificarSeed(valor))`; se preenchido e inválido, `avisar` e
não iniciar; se vazio, `criarRun()`. `cabecalhoRun` (em `render.js`) passa a mostrar o
código da seed.

- [ ] **Step 1: Adicionar a mensagem e a exibição no `render.js`**

Em `js/ui/render.js`, adicionar a chave ao dicionário `MENSAGENS` (que hoje termina em
`"slot-vazio": "Slot vazio.",`):

```js
  "slot-vazio": "Slot vazio.",
  "seed-invalida": "Código de seed inválido.",
```

Adicionar o import de `codificarSeed` no topo de `render.js`. Hoje há, entre outros:
`import { precoVenda } from "../engine/economy.js";`. Acrescentar logo abaixo:

```js
import { codificarSeed } from "../engine/seed.js";
```

E em `cabecalhoRun(state)`, que hoje é:

```js
export function cabecalhoRun(state) {
  return el("header", { classe: "cabecalho-run" },
    el("span", { classe: "numero dinheiro" }, `$${state.dinheiro}`),
    el("span", {}, `Ante ${state.ante}/8`),
    el("span", { classe: "descricao" }, `Rodadas vencidas: ${state.estatisticas.rodadas}`),
  );
}
```

passar a incluir a seed:

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

- [ ] **Step 2: Adicionar o input de seed no `renderTitulo` (`screens.js`)**

Em `js/ui/screens.js`, adicionar o import de `decodificarSeed`. Hoje há
`import { criarRun, carregar } from "../state.js";`. Acrescentar logo abaixo:

```js
import { decodificarSeed } from "../engine/seed.js";
```

A função `renderTitulo` hoje é:

```js
function renderTitulo() {
  const secao = secaoDe("titulo");
  secao.replaceChildren(
    el("h1", { classe: "logo" }, "BalatroJS"),
    el("p", { classe: "subtitulo" }, "um clone de estudo em JavaScript puro"),
    el("button", { classe: "botao botao-azul", onclick: () => { app.state = criarRun(); atualizar(); } }, "Jogar"),
  );
  const save = carregar();
  if (save) {
    secao.append(el("button", { classe: "botao", onclick: () => { app.state = save; atualizar(); } }, "Continuar"));
  }
}
```

Substituir por (input de seed + lógica de validação no "Jogar"):

```js
function renderTitulo() {
  const secao = secaoDe("titulo");
  const campoSeed = el("input", {
    id: "campo-seed",
    classe: "campo-seed",
    type: "text",
    placeholder: "Seed (opcional)",
    maxlength: "6",
  });
  function jogar() {
    const valor = campoSeed.value.trim();
    if (valor === "") {
      app.state = criarRun();
    } else {
      const semente = decodificarSeed(valor);
      if (semente === null) { avisar("seed-invalida"); return; }
      app.state = criarRun(semente);
    }
    atualizar();
  }
  secao.replaceChildren(
    el("h1", { classe: "logo" }, "BalatroJS"),
    el("p", { classe: "subtitulo" }, "um clone de estudo em JavaScript puro"),
    campoSeed,
    el("button", { classe: "botao botao-azul", onclick: jogar }, "Jogar"),
  );
  const save = carregar();
  if (save) {
    secao.append(el("button", { classe: "botao", onclick: () => { app.state = save; atualizar(); } }, "Continuar"));
  }
}
```

- [ ] **Step 3: Estilo mínimo do input em `css/screens.css`**

Adicionar ao FIM de `css/screens.css` um estilo simples e coerente com a paleta:

```css
.campo-seed {
  display: block;
  margin: 0.6rem auto;
  padding: 0.5rem 0.8rem;
  width: 12rem;
  text-align: center;
  text-transform: uppercase;
  font: inherit;
  letter-spacing: 0.15em;
  color: var(--texto);
  background: var(--painel);
  border: 2px solid var(--painel-borda);
  border-radius: 8px;
}
.campo-seed::placeholder { color: var(--texto-suave); letter-spacing: normal; }
```

- [ ] **Step 4: Rodar a suíte (nada deve quebrar)**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: mesmo total da Task 1 (`80` se o fundo já foi feito, senão `76`), 0 falhas.
A mudança é de UI; os testes não a exercitam.

- [ ] **Step 5: Smoke headless (carga dos módulos de UI)**

Validar que `screens.js` e `render.js` carregam sem erro de import sob um shim mínimo:

```bash
node --input-type=module -e '
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ setAttribute(){}, append(){}, addEventListener(){}, classList:{add(){},remove(){}}, style:{} }), body:{ append(){} } };
globalThis.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const r = await import("./js/ui/render.js");
const s = await import("./js/engine/seed.js");
if (typeof r.cabecalhoRun !== "function") { console.error("cabecalhoRun ausente"); process.exit(1); }
if (typeof s.codificarSeed !== "function") { console.error("codificarSeed ausente"); process.exit(1); }
console.log("OK render.js e seed.js carregam");
'
```

Esperado: `OK render.js e seed.js carregam`.

- [ ] **Step 6: Verificação manual (anotar, não bloqueia)**

Servir e confirmar: input na tela de título; jogar com seed válida cria a run e o
cabeçalho mostra `Seed: <codigo>`; recarregar a página e comparar que a mesma seed
reproduz a mesma run (mesmos chefes/loja); seed inválida mostra aviso. Sem browser →
pendência visual.

- [ ] **Step 7: Commit**

```bash
git add js/ui/screens.js js/ui/render.js css/screens.css
git commit -m "feat: input de seed no título e exibição no cabeçalho (milestone #7)

Tela de título aceita um código de seed (vazio = aleatória, inválido = aviso);
cabecalhoRun mostra Seed: <codigo>. Reusa codificar/decodificarSeed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Esperado: total esperado da Task 1, 0 falhas.

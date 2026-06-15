# Layout preenchido — Etapa 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar as cartas da mão maiores e adicionar um verso de baralho (pilha + contagem restantes/total) no canto inferior direito da mesa, que assume o clique de "ver cartas restantes" antes feito pelo botão "Baralho: N".

**Architecture:** Só camada de UI. `js/ui/screens.js` ganha `versoBaralho(state)` inserida na `.mesa` e perde o botão "Baralho: N" dos `.controles` (o verso chama `mostrarBaralho`, que já existe). `css/screens.css` estiliza o verso e torna a `.mesa` `position: relative` para ancorar o canto. `css/cards.css` aumenta `.carta` e reajusta breakpoints/overlap. Engine, shape do `state` e save intocados.

**Tech Stack:** JS ES modules nativos (helper `el()` de `render.js`), CSS3, sem build, zero deps. Harness `node tests/todos.js` (Node 18+).

> **Nota sobre testes (importante):** sem lógica de regras nova — é DOM na UI + CSS. `js/ui/screens.js` é UI (não calcula regras) e não tem teste unitário. NÃO escreva testes JS. Contrato: a suíte existente continua verde (`node tests/todos.js` → **112 teste(s), 0 falha(s)**) como guarda de regressão. Validação real é VISUAL no navegador (chrome-devtools MCP), descrita em cada task e na seção final.

**Spec:** `docs/superpowers/specs/2026-06-15-layout-preenchido-etapa2-design.md`

---

## File Structure

- **Modify:** `js/ui/screens.js` — adicionar `versoBaralho(state)`; inseri-la na `.mesa` (depois da `.base`, dentro de `renderRodada`); remover o botão "Baralho: N" da fileira `.controles` (linha ~129).
- **Modify:** `css/screens.css` — `.mesa` ganha `position: relative`; bloco novo para `.baralho-canto`/`.pilha-verso`/`.verso-carta`/`.baralho-contagem`; ajuste responsivo do canto a ≤600px.
- **Modify:** `css/cards.css` — aumentar `.carta` (72×100 → 88×122) e os breakpoints (900px, 600px); aumentar overlap `.mao .carta`.

Ordem: Task 1 (JS estrutura) → Task 2 (CSS do verso) → Task 3 (cartas maiores + responsivo + validação). Task 1 fica "feio" sem o CSS (verso sem estilo), mas é funcional; Task 2 dá o visual do canto; Task 3 aumenta as cartas e fecha o mobile.

---

## Task 1: `versoBaralho` na mesa + remover botão "Baralho: N" (JS)

**Files:**
- Modify: `js/ui/screens.js` (`renderRodada` ~111-134; nova função após `painelLateral`)
- Verify: `tests/todos.js`

- [ ] **Step 1: Confirmar baseline verde**

Run: `node tests/todos.js`
Expected: última linha `112 teste(s), 0 falha(s)`

- [ ] **Step 2: Remover o botão "Baralho: N" dos `.controles`**

Localizar em `renderRodada` (linha ~129):
```js
          el("button", { classe: "botao botao-mini", onclick: () => mostrarBaralho(state) }, `Baralho: ${rodada.baralho.length}`),
```
REMOVER essa linha inteira. (A fileira `.controles` fica com Jogar / Descartar / Valor / Naipe. O acesso a "cartas restantes" passa para o verso do baralho, adicionado no Step 4.)

- [ ] **Step 3: Adicionar o verso à `.mesa`**

Localizar o fechamento do bloco `.base` dentro de `.mesa` (linhas ~122-132):
```js
      el("div", { classe: "base" },
        el("div", { classe: "mao" }, ...rodada.mao.map((carta, i) => cartaDaMao(state, carta, i))),
        el("div", { classe: "controles" },
          el("button", { id: "btn-jogar", classe: "botao botao-azul", disabled: "", onclick: () => aoJogar(state) }, "Jogar"),
          el("button", { id: "btn-descartar", classe: "botao botao-vermelho", disabled: "", onclick: () => aoDescartar(state) }, "Descartar"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "valor"); atualizar(); } }, "Valor"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "naipe"); atualizar(); } }, "Naipe"),
        ),
      ),
    ),
  );
```
Inserir `versoBaralho(state)` como ÚLTIMO filho da `.mesa`, logo após o `el("div", { classe: "base" }, ...)` e antes do `)` que fecha a `.mesa`. O resultado fica:
```js
      el("div", { classe: "base" },
        el("div", { classe: "mao" }, ...rodada.mao.map((carta, i) => cartaDaMao(state, carta, i))),
        el("div", { classe: "controles" },
          el("button", { id: "btn-jogar", classe: "botao botao-azul", disabled: "", onclick: () => aoJogar(state) }, "Jogar"),
          el("button", { id: "btn-descartar", classe: "botao botao-vermelho", disabled: "", onclick: () => aoDescartar(state) }, "Descartar"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "valor"); atualizar(); } }, "Valor"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "naipe"); atualizar(); } }, "Naipe"),
        ),
      ),
      versoBaralho(state),
    ),
  );
```
(O `versoBaralho(state)` é o último argumento da `.mesa`. A vírgula após ele é opcional em JS, mas mantê-la é consistente com o resto do arquivo.)

- [ ] **Step 4: Criar a função `versoBaralho`**

Inserir esta função LOGO APÓS o fim da função `painelLateral` (ela termina no `}` da linha ~165) e antes de `function cartaDaMao(...)`:
```js
// Verso de baralho no canto inferior direito: pilha decorativa (3 versos) + contagem
// "restantes/total". Clicar abre o overlay de cartas restantes (mostrarBaralho).
// O total é mao + monte (sem hardcode "52"), robusto p/ baralhos de tamanho diferente.
function versoBaralho(state) {
  const rodada = state.rodada;
  const restantes = rodada.baralho.length;
  const total = rodada.mao.length + restantes;
  return el("div", { classe: "baralho-canto", title: "Ver cartas restantes", onclick: () => mostrarBaralho(state) },
    el("div", { classe: "pilha-verso" },
      el("div", { classe: "verso-carta", "aria-hidden": "true" }),
      el("div", { classe: "verso-carta", "aria-hidden": "true" }),
      el("div", { classe: "verso-carta", "aria-hidden": "true" }),
    ),
    el("div", { classe: "baralho-contagem" },
      el("span", { classe: "numero" }, String(restantes)),
      el("span", { classe: "barra" }, `/${total}`),
    ),
  );
}
```

Notas:
- `mostrarBaralho` já está definida em `screens.js` (função, hoisted) — pode ser chamada de `versoBaralho` mesmo estando declarada mais abaixo no arquivo.
- O helper `el()` aceita `"aria-hidden"` como atributo string (cai no ramo `setAttribute` de `render.js`). `title` também vira atributo nativo (tooltip do browser).

- [ ] **Step 5: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 6: Commit**

```bash
git add js/ui/screens.js
git commit -m "feat: verso de baralho no canto + remove botão Baralho dos controles (layout etapa 2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Estilo do verso + `.mesa` relativa (CSS)

**Files:**
- Modify: `css/screens.css` (`.mesa` linha ~138; bloco novo após `.controles`)
- Verify: `tests/todos.js`

- [ ] **Step 1: Tornar a `.mesa` o contexto de posicionamento do canto**

Localizar (linha ~138):
```css
.mesa { display: flex; flex-direction: column; gap: 1rem; min-height: 90vh; }
```
Substituir por:
```css
.mesa { display: flex; flex-direction: column; gap: 1rem; min-height: 90vh; position: relative; }
```

- [ ] **Step 2: Adicionar o bloco do verso de baralho**

Localizar o fim da regra `.controles` (linhas ~171-178):
```css
.controles {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  align-items: center;
  margin-top: 0.9rem;
  flex-wrap: wrap;
}
```
Inserir LOGO APÓS o `}` de `.controles`:
```css
/* Verso de baralho no canto inferior direito */
.baralho-canto {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
}
.pilha-verso {
  position: relative;
  width: 88px;
  height: 122px;
  transition: transform 0.1s;
}
.baralho-canto:hover .pilha-verso { transform: translateY(-2px); }
.verso-carta {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background:
    repeating-linear-gradient(45deg,
      rgba(245, 185, 66, 0.12) 0,
      rgba(245, 185, 66, 0.12) 6px,
      transparent 6px,
      transparent 12px),
    var(--vermelho-escuro);
  border: 2px solid rgba(244, 241, 232, 0.5);
  box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.4);
}
.verso-carta:nth-child(2) { top: -3px; left: -3px; }
.verso-carta:nth-child(3) { top: -6px; left: -6px; }
.baralho-contagem { font-size: 0.9rem; }
.baralho-contagem .barra { color: var(--texto-suave); }
```

Notas:
- A pilha tem 88×122 (mesmo tamanho da carta-alvo da Task 3). Os `.verso-carta` são absolutos dentro de `.pilha-verso`; o `:nth-child(2/3)` desloca os de baixo para criar profundidade. O 1º filho (sem deslocamento) é o topo visual.
- `.numero` (fonte pixel) já está em base.css e estiliza o número de restantes; `.barra` deixa o `/total` em tom suave.
- O padrão diagonal é `repeating-linear-gradient` dourado translúcido sobre `--vermelho-escuro`, conforme o spec.

- [ ] **Step 3: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 4: Validar no navegador (desktop 1280px)**

Servir (`python3 -m http.server 8123` na raiz, se ainda não estiver) e abrir `http://localhost:8123/index.html`. Entrar numa rodada. Confirmar via screenshot:
- O verso (pilha de 3 cartas com padrão diagonal dourado sobre vermelho) aparece no canto inferior direito da mesa, com a contagem "N/52" abaixo.
- Clicar no verso abre o overlay de cartas restantes (`mostrarBaralho`).
- A fileira de controles tem só Jogar / Descartar / Valor / Naipe (o botão "Baralho: N" sumiu).
Se não houver browser, registrar pendência visual.

- [ ] **Step 5: Commit**

```bash
git add css/screens.css
git commit -m "feat: estilo do verso de baralho no canto inferior direito (layout etapa 2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Cartas maiores + responsivo + validação final (CSS)

**Files:**
- Modify: `css/cards.css` (`.carta` ~2-13; `.pip`/`.canto`; overlap `.mao .carta` está em `css/screens.css:167`; blocos `@media`)
- Modify: `css/screens.css` (overlap `.mao .carta` linha ~167; bloco `@media (max-width: 600px)` do canto)
- Verify: `tests/todos.js`

- [ ] **Step 1: Aumentar a carta base (desktop)**

Em `css/cards.css`, localizar (linhas ~2-13):
```css
.carta {
  position: relative;
  width: 72px;
  height: 100px;
  flex: none;
  background: #f8f5ec;
  color: #1b1b1b;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: transform 0.12s;
}
```
Trocar SÓ as duas linhas de dimensão:
```css
  width: 88px;
  height: 122px;
```
(O resto da regra permanece igual.)

- [ ] **Step 2: Acompanhar com `.pip` e `.canto`**

Em `css/cards.css`, localizar o `font-size` do `.canto` (linha ~18) e do `.pip` (linha ~37).

No `.canto` (linhas ~15-23):
```css
.carta .canto {
  position: absolute;
  top: 5px;
  left: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.05;
  text-align: center;
}
```
Trocar `font-size: 0.85rem;` por `font-size: 1rem;`.

No `.pip` (linhas ~31-38):
```css
.carta .pip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.1rem;
}
```
Trocar `font-size: 2.1rem;` por `font-size: 2.5rem;`.

- [ ] **Step 3: Aumentar o overlap da mão (desktop)**

O overlap da mão fica em `css/screens.css` (não em cards.css). Localizar (linha ~167):
```css
.mao .carta { margin-left: -16px; }
```
Substituir por:
```css
.mao .carta { margin-left: -20px; }
```

- [ ] **Step 4: Reajustar o breakpoint ≤900px**

Em `css/cards.css`, localizar o bloco (linhas ~130-141):
```css
@media (max-width: 900px) {
  .carta { width: 62px; height: 86px; }
  .carta .pip { font-size: 1.8rem; }
  .carta .canto { font-size: 0.75rem; }
  .mao .carta { margin-left: -14px; }

  .coringa, .consumivel, .voucher, .slot-vazio {
    width: 84px;
    height: 108px;
  }
  .coringa, .consumivel, .voucher { font-size: 0.7rem; }
}
```
Substituir as 4 primeiras regras de carta por:
```css
  .carta { width: 76px; height: 106px; }
  .carta .pip { font-size: 2.1rem; }
  .carta .canto { font-size: 0.85rem; }
  .mao .carta { margin-left: -18px; }
```
(As regras de coringa/consumível/voucher permanecem.)

- [ ] **Step 5: Reajustar o breakpoint ≤600px (cartas)**

Em `css/cards.css`, localizar o bloco (linhas ~143-155):
```css
@media (max-width: 600px) {
  .carta { width: 52px; height: 72px; }
  .carta .pip { font-size: 1.5rem; }
  .carta .canto { font-size: 0.65rem; top: 3px; left: 4px; }
  .carta .canto.invertido { bottom: 3px; right: 4px; }
  .mao .carta { margin-left: -12px; }

  .coringa, .consumivel, .voucher, .slot-vazio {
    width: 56px;
    height: 74px;
  }
  .coringa, .consumivel, .voucher { font-size: 0.62rem; }
}
```
Substituir as 5 primeiras regras de carta por:
```css
  .carta { width: 60px; height: 84px; }
  .carta .pip { font-size: 1.7rem; }
  .carta .canto { font-size: 0.7rem; top: 3px; left: 4px; }
  .carta .canto.invertido { bottom: 3px; right: 4px; }
  .mao .carta { margin-left: -14px; }
```
(As regras de coringa/consumível/voucher permanecem.)

- [ ] **Step 6: Encolher o verso no mobile (≤600px)**

Em `css/screens.css`, dentro do bloco `@media (max-width: 600px)`, localizar a linha das regras mobile da mesa:
```css
  .coringas, .consumiveis { flex-wrap: wrap; justify-content: center; }
```
Inserir LOGO APÓS essa linha:
```css
  .pilha-verso { width: 60px; height: 84px; }
  .baralho-contagem { font-size: 0.75rem; }
```
(60×84 casa com a carta mobile do Step 5; o canto absoluto encolhe junto. As regras ficam dentro do bloco `@media (max-width: 600px)`, ao lado das demais regras da `.mesa` mobile.)

- [ ] **Step 7: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 8: Validar no navegador (desktop + mobile)**

Servir e abrir `http://localhost:8123/index.html`. Entrar numa rodada.
- Desktop 1280px: as cartas da mão estão visivelmente maiores (88×122) e legíveis; 8 cartas ainda cabem na base com o overlap; verso no canto inferior direito do tamanho da carta.
- Mobile 360px: redimensionar a janela. Confirmar `document.documentElement.scrollWidth === document.documentElement.clientWidth` (sem overflow horizontal); verso no canto sem sobrepor de forma feia as cartas/controles; cartas (60×84) cabem.
Screenshots para registro. Se não houver browser, registrar pendência.

- [ ] **Step 9: Commit**

```bash
git add css/cards.css css/screens.css
git commit -m "feat: cartas maiores + verso responsivo (layout etapa 2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificação final (após as 3 tasks)

- [ ] **Suíte verde:** `node tests/todos.js` → `112 teste(s), 0 falha(s)`.
- [ ] **Desktop 1280px:** cartas da mão maiores e legíveis; verso de baralho (pilha diagonal) no canto inferior direito com contagem `N/52`; clique no verso abre o overlay; controles sem o botão "Baralho: N".
- [ ] **Mobile 360px:** sem overflow horizontal (`scrollWidth === clientWidth`); verso no canto sem sobreposição feia; cartas maiores cabem.
- [ ] **Merge:** branch de feature, merge `--no-ff` em `main`, apagar a branch, push (preferência do usuário nas milestones anteriores).

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Cartas maiores 88×122 + breakpoints + overlap: Task 3 Steps 1-5. ✓
- `.pip`/`.canto` acompanham: Task 3 Step 2. ✓
- Verso no canto inferior direito (DOM `versoBaralho`): Task 1 Steps 3-4. ✓
- `.mesa` position: relative ancora o canto absoluto: Task 2 Step 1. ✓
- Pilha de 3 versos com padrão diagonal dourado/vermelho-escuro, borda clara, moldura inset: Task 2 Step 2. ✓
- Contagem restantes/total (= mao + monte, sem hardcode): Task 1 Step 4 (`total = rodada.mao.length + restantes`). ✓
- Verso assume o clique (mostrarBaralho) e botão "Baralho: N" removido: Task 1 Steps 2 e 4. ✓
- Hover de interatividade: Task 2 Step 2 (`.baralho-canto:hover .pilha-verso`). ✓
- Responsivo ≤600px (verso encolhe, sem overflow): Task 3 Step 6 + validação Step 8. ✓
- Validação navegador desktop+mobile: Tasks 2-3 + seção final. ✓

**Placeholders:** nenhum — todo JS/CSS escrito por extenso, com trechos a localizar copiados do arquivo real.

**Consistência:** classes do JS (`baralho-canto`, `pilha-verso`, `verso-carta`, `baralho-contagem`, `barra`) batem com as estilizadas no CSS (Task 2). O tamanho da `.pilha-verso` (88×122 desktop / 60×84 mobile) casa com `.carta` (Task 3). `mostrarBaralho` é reusada (hoisted). Trailer `Claude Opus 4.8`. Trechos a substituir confirmados por leitura (screens.js 111-165, cards.css 1-155, screens.css 138-178 e 167).

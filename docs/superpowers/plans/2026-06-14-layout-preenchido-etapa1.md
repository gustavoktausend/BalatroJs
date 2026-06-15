# Layout preenchido — Etapa 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar a barra lateral da tela de rodada em "cartuchos" densos (estilo Balatro, paleta nossa) com o chips×mult em caixas grandes coloridas, preenchendo o espaço vazio da lateral.

**Architecture:** Só camada de UI. `painelLateral` (em `js/ui/screens.js`) é reescrita para emitir 5 cartuchos semânticos; a prévia da mão (`#previa-mao`) volta da centro para o cartucho "mão atual" e ganha estado ocioso neutro; o `.centro` volta a hospedar só `#area-jogada`. O CSS (`css/screens.css`) estiliza os cartuchos e transforma os spans `.chips`/`.mult` da prévia em caixas grandes. Engine intocado, sem mudança de save.

**Tech Stack:** JS ES modules nativos (helper `el()` de `render.js`), CSS3, sem build, zero deps. Harness `node tests/todos.js` (Node 18+).

> **Nota sobre testes (importante):** sem lógica de regras nova — é reorganização de DOM na UI + CSS. `js/ui/screens.js` é UI (não calcula regras) e não tem teste unitário; `detectarMao`/`valoresDaMao` já têm cobertura no engine. NÃO escreva testes JS. Contrato: a suíte existente continua verde (`node tests/todos.js` → **112 teste(s), 0 falha(s)**) como guarda de regressão. Validação real é VISUAL no navegador (chrome-devtools MCP), descrita em cada task e na seção final.

**Spec:** `docs/superpowers/specs/2026-06-14-layout-preenchido-etapa1-design.md`

---

## File Structure

- **Modify:** `js/ui/screens.js` — reescrever `painelLateral` em cartuchos; mover `#previa-mao` para o cartucho da mão; `#area-jogada` volta a ser filho único do `.centro`; estado ocioso em `atualizarControles`; remover o `replaceChildren()` de `aoJogar`.
- **Modify:** `css/screens.css` — estilos dos cartuchos + caixas chips×mult; refazer regras `#previa-mao` (linhas 93-96) para a lateral, preservando `#area-jogada:empty`; ajustar `@media ≤600px` (linhas 197-199).

Ordem: Task 1 (JS estrutura) → Task 2 (CSS desktop) → Task 3 (CSS mobile + validação). Task 1 pode ficar "feio" sem o CSS, mas é funcional; Task 2 dá o visual; Task 3 garante mobile.

---

## Task 1: Reescrever `painelLateral` em cartuchos + estado ocioso (JS)

**Files:**
- Modify: `js/ui/screens.js` (`renderRodada` ~119-121, `painelLateral` ~137-157, `atualizarControles` ~178-188, `aoJogar` ~201)
- Verify: `tests/todos.js`

- [ ] **Step 1: Confirmar baseline verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 2: `#area-jogada` volta a ser filho único do `.centro` (`renderRodada`)**

Localizar (linhas ~119-122):
```js
      el("div", { classe: "centro" },
        el("div", { id: "previa-mao" }),
        el("div", { id: "area-jogada" }),
      ),
```
Substituir por:
```js
      el("div", { classe: "centro" },
        el("div", { id: "area-jogada" }),
      ),
```

- [ ] **Step 3: Reescrever `painelLateral` em cartuchos**

Substituir a função `painelLateral` INTEIRA (linhas ~137-157) por:
```js
function painelLateral(state) {
  const rodada = state.rodada;
  const blind = state.blindAtual;
  const titulo = blind.tipo === "chefe" ? CHEFES[blind.chefeId].nome : NOME_BLIND[blind.tipo];
  return [
    el("div", { classe: "cartucho cartucho-blind" + (blind.tipo === "chefe" ? " chefe" : "") },
      el("h3", {}, titulo),
    ),
    el("div", { classe: "cartucho cartucho-alvo" },
      blind.tipo === "chefe" ? el("p", { classe: "descricao" }, CHEFES[blind.chefeId].descricao) : null,
      el("p", { classe: "rotulo-cartucho" }, "Pontue pelo menos"),
      el("p", { classe: "numero alvo-valor" }, blind.alvo.toLocaleString("pt-BR")),
      el("p", { classe: "recompensa" }, "Recompensa: ", el("span", { classe: "numero dinheiro" }, `$${PREMIOS[blind.tipo]}`)),
    ),
    el("div", { classe: "cartucho cartucho-score" },
      el("p", { classe: "rotulo-cartucho" }, "Pontuação da rodada"),
      el("p", { classe: "numero score-valor", id: "score-rodada" }, rodada.pontuacao.toLocaleString("pt-BR")),
    ),
    el("div", { classe: "cartucho cartucho-mao" },
      el("div", { id: "previa-mao" }),
    ),
    el("div", { classe: "cartucho cartucho-contadores" },
      el("div", { classe: "contador" }, el("span", { classe: "rotulo-contador" }, "Mãos"), el("span", { classe: "numero chips" }, String(rodada.maosRestantes))),
      el("div", { classe: "contador" }, el("span", { classe: "rotulo-contador" }, "Descartes"), el("span", { classe: "numero mult" }, String(rodada.descartesRestantes))),
      el("div", { classe: "contador" }, el("span", { classe: "rotulo-contador" }, "Dinheiro"), el("span", { classe: "numero dinheiro" }, `$${state.dinheiro}`)),
      el("div", { classe: "contador" }, el("span", { classe: "rotulo-contador" }, "Ante"), el("span", { classe: "numero" }, `${state.ante}/8`)),
    ),
  ];
}
```

Notas:
- A recompensa usa `PREMIOS[blind.tipo]` — `PREMIOS` (`{ pequena: 3, grande: 4, chefe: 5 }`) JÁ está importado em `screens.js` (linha 11) e é a mesma fonte usada na tela de seleção de blind (`screens.js:97`). NÃO usar `blind.recompensa`: `state.blindAtual` é só `{ tipo, chefeId, alvo }` (run.js:23) e a recompensa real é dinâmica (calculada por `recompensaBlind` só na vitória). `PREMIOS[blind.tipo]` é o valor-base correto e consistente.
- `#previa-mao` agora vive em `.cartucho-mao`. `#score-rodada` é um id novo (não estritamente necessário, mas deixa a pontuação localizável; não há lógica que o use ainda — é só marcação, sem custo).

- [ ] **Step 4: Estado ocioso neutro em `atualizarControles`**

Localizar (linhas ~178-182):
```js
  const previa = document.getElementById("previa-mao");
  if (selecao.size === 0) {
    previa.replaceChildren();
    return;
  }
```
Substituir por:
```js
  const previa = document.getElementById("previa-mao");
  if (selecao.size === 0) {
    previa.classList.add("previa-ociosa");
    previa.innerHTML =
      `<span class="nome-mao">— <small>&nbsp;</small></span>` +
      `<span class="numero chips">0</span> × <span class="numero mult">0</span>`;
    return;
  }
  previa.classList.remove("previa-ociosa");
```
(O `previa.classList.remove("previa-ociosa")` deve ficar ANTES do `previa.innerHTML = ...` do ramo de seleção, que permanece logo abaixo nas linhas ~186-188 inalterado.)

- [ ] **Step 5: Remover o `replaceChildren()` de `aoJogar`**

Localizar (em `aoJogar`, ~linha 201):
```js
  document.getElementById("previa-mao").replaceChildren(); // libera o centro para a animação
```
REMOVER essa linha inteira. (A prévia voltou para a lateral; não colide mais com o centro. Após a jogada, `atualizar()` re-renderiza e `atualizarControles` repõe o estado ocioso.)

- [ ] **Step 6: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 7: Commit**

```bash
git add js/ui/screens.js
git commit -m "feat: lateral em cartuchos + prévia volta para a lateral (layout etapa 1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Estilo dos cartuchos + caixas chips×mult (CSS desktop)

**Files:**
- Modify: `css/screens.css` (linhas ~88-96 e regras novas)
- Verify: `tests/todos.js`

- [ ] **Step 1: Substituir as regras de painel/prévia antigas**

Localizar (linhas ~88-96):
```css
.painel-blind, .painel-pontuacao {
  background: var(--painel-claro);
  border-radius: 8px;
  padding: 0.7rem;
}
#previa-mao { text-align: center; font-size: 2rem; line-height: 1.4; }
#previa-mao:empty, #area-jogada:empty { display: none; }
#previa-mao .nome-mao { display: block; font-weight: 700; font-size: 1.6rem; }
#previa-mao .nome-mao small { font-size: 1rem; color: var(--texto-suave); }
```
Substituir por:
```css
/* Cartuchos da lateral */
.cartucho {
  background: var(--painel-claro);
  border-radius: 8px;
  padding: 0.7rem;
}
.cartucho-blind {
  text-align: center;
  font-weight: 700;
  background: var(--painel-borda);
}
.cartucho-blind.chefe h3 { color: var(--vermelho); }
.cartucho-alvo {
  text-align: center;
  background: rgba(245, 185, 66, 0.12);
  border: 1px solid var(--dourado);
}
.rotulo-cartucho { color: var(--texto-suave); font-size: 0.85rem; }
.alvo-valor { font-size: 1.5rem; color: var(--vermelho); }
.recompensa { font-size: 0.9rem; }
.cartucho-score { text-align: center; }
.score-valor { display: block; font-size: 2rem; }

/* Prévia da mão com caixas chips × mult */
#previa-mao { text-align: center; }
#previa-mao .nome-mao { display: block; font-weight: 700; margin-bottom: 0.4rem; }
#previa-mao .nome-mao small { font-size: 0.8rem; color: var(--texto-suave); }
#previa-mao .chips, #previa-mao .mult {
  display: inline-block;
  min-width: 3rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  font-size: 1.6rem;
  color: var(--texto);
}
#previa-mao .chips { background: var(--azul-escuro); }
#previa-mao .mult { background: var(--vermelho-escuro); }
#previa-mao.previa-ociosa .chips, #previa-mao.previa-ociosa .mult { opacity: 0.4; }
#area-jogada:empty { display: none; }

/* Grade de contadores */
.cartucho-contadores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  text-align: center;
}
.contador { display: flex; flex-direction: column; }
.rotulo-contador { color: var(--texto-suave); font-size: 0.8rem; }
```

Notas:
- O `#area-jogada:empty { display: none; }` é PRESERVADO (a parte `#previa-mao:empty` foi removida porque a prévia agora nunca fica vazia — vira estado ocioso).
- As caixas reaproveitam as classes `.chips`/`.mult` que `atualizarControles` já gera; o CSS de `.numero` (fonte pixel) continua aplicado.

- [ ] **Step 2: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 3: Validar no navegador (desktop 1280px)**

Servir (`python3 -m http.server 8123` na raiz, se ainda não estiver) e abrir `http://localhost:8123/index.html`. Entrar numa rodada. Confirmar via screenshot:
- A lateral está preenchida com os 5 cartuchos (blind / alvo+recompensa / score / mão / contadores), sem o vazio de antes.
- Selecionar cartas → as caixas chips×mult aparecem grandes (azul × vermelho) no cartucho da mão.
- Sem seleção → estado ocioso ("—" e "0 × 0" apagados), sem cartucho vazio feio.
Se não houver browser, registrar pendência visual.

- [ ] **Step 4: Commit**

```bash
git add css/screens.css
git commit -m "feat: estilo dos cartuchos e caixas chips×mult na lateral (layout etapa 1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Responsivo mobile + validação final (CSS)

**Files:**
- Modify: `css/screens.css` (bloco `@media (max-width: 600px)`, linhas ~197-199)
- Verify: `tests/todos.js`

- [ ] **Step 1: Ajustar o bloco mobile**

Localizar (no `@media (max-width: 600px)`, linhas ~197-199):
```css
  .painel-blind, .painel-pontuacao { flex: 1 1 45%; padding: 0.5rem; }
  #previa-mao { font-size: 1.4rem; }
  #previa-mao .nome-mao { font-size: 1.1rem; }
```
Substituir por:
```css
  .cartucho { flex: 1 1 45%; padding: 0.5rem; }
  .cartucho-mao, .cartucho-contadores { flex-basis: 100%; }
  .cartucho-alvo .alvo-valor { font-size: 1.2rem; }
  .score-valor { font-size: 1.5rem; }
  #previa-mao .chips, #previa-mao .mult { font-size: 1.2rem; min-width: 2.4rem; padding: 0.3rem 0.5rem; }
```

Nota: a `.lateral` já é faixa horizontal com `flex-wrap` no mobile (milestone #5). Os cartuchos viram itens flex que quebram em linhas; `.cartucho-mao`/`.cartucho-contadores` ocupam a linha inteira.

- [ ] **Step 2: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 3: Validar no navegador (mobile 360px)**

Redimensionar para 360px de largura na tela de rodada. Confirmar:
- `document.documentElement.scrollWidth === clientWidth` (sem overflow horizontal).
- Os cartuchos da lateral (faixa do topo) ficam legíveis, quebram em linhas sem estourar.
Screenshot para registro. Se não houver browser, registrar pendência.

- [ ] **Step 4: Commit**

```bash
git add css/screens.css
git commit -m "feat: cartuchos responsivos no celular (layout etapa 1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Verificação final (após as 3 tasks)

- [ ] **Suíte verde:** `node tests/todos.js` → `112 teste(s), 0 falha(s)`.
- [ ] **Desktop 1280px:** lateral preenchida em cartuchos; caixas chips×mult ao selecionar; estado ocioso neutro; centro anima as cartas jogadas em fileira (fix do commit 2956f01 preservado) e a prévia/ocioso reaparece após a jogada.
- [ ] **Mobile 360px:** lateral horizontal sem overflow (`scrollWidth === clientWidth`); cartuchos legíveis.
- [ ] **Merge:** branch de feature, merge `--no-ff` em `main`, apagar a branch, push (preferência do usuário nas últimas milestones).

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Lateral em 5 cartuchos: Task 1 Step 3. ✓
- Prévia volta para a lateral; `#area-jogada` filho único do centro: Task 1 Steps 2-3. ✓
- Caixas chips×mult grandes: Task 2 Step 1. ✓
- Estado ocioso neutro ("—", "0×0" apagado): Task 1 Step 5 + CSS `.previa-ociosa` Task 2. ✓
- Remover `replaceChildren` de `aoJogar`: Task 1 Step 6. ✓
- Preservar `#area-jogada:empty`: Task 2 Step 1 (nota explícita). ✓
- Cores da paleta atual: Task 2 (var(--painel-claro/borda), rgba dourado, azul/vermelho-escuro). ✓
- Responsivo ≤600px: Task 3. ✓
- Validação navegador desktop+mobile: Tasks 2-3 + seção final. ✓

**Placeholders:** nenhum — todo JS/CSS escrito por extenso. O único ponto "a confirmar" é o nome do campo de recompensa do blind, que tem um Step de verificação dedicado (Task 1 Step 4) com instrução concreta de como ajustar — não é um placeholder, é uma verificação necessária contra o engine.

**Consistência:** classes usadas no JS (`cartucho`, `cartucho-blind/alvo/score/mao/contadores`, `previa-ociosa`, `rotulo-cartucho`, `alvo-valor`, `score-valor`, `recompensa`, `contador`, `rotulo-contador`) batem com as estilizadas no CSS (Tasks 2-3). `#previa-mao`/`#area-jogada` mantêm os ids que `atualizarControles`/`animarJogada` usam por getElementById. Trailer `Claude Fable 5`. Trechos a substituir confirmados por leitura (screens.js 111-188, screens.css 79-96 e 197-199).

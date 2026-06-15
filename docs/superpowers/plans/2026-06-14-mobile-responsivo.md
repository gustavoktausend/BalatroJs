# Layout mobile/responsivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o BalatroJS legível e jogável de celular retrato (~360px) a desktop, via media queries CSS puras.

**Architecture:** Apenas CSS. O default (desktop, `>900px`) permanece intacto; blocos `@media (max-width: 900px)` (tablet) e `@media (max-width: 600px)` (celular) ajustam tamanhos e layout para baixo. Cada bloco fica no fim do arquivo CSS do seu domínio. Nenhuma mudança em JS, HTML ou no `state`/save. A reorganização da tela de rodada é puramente CSS: como `.lateral` é o 1º filho de `[data-tela="rodada"]` (`js/ui/screens.js:116`), trocar o container para `flex-direction: column` no celular já a leva ao topo, sem mexer no DOM.

**Tech Stack:** CSS3 (media queries, flexbox), sem build, zero dependências. Harness de testes próprio em `tests/` (Node 18+).

> **Nota sobre testes (importante para o executor):** esta milestone não adiciona lógica JS, então não há testes unitários novos a escrever. O contrato de verificação é: **a suíte existente continua verde** (`node tests/todos.js`, baseline **112 testes, 0 falhas**) — ela é a guarda de regressão, garantindo que nenhuma mudança de CSS quebrou um import ou arquivo. A validação visual real é por inspeção em larguras de viewport (360 / 768 / 1280px), que fica pendente neste ambiente sem browser, como nas milestones anteriores. Cada task abaixo termina rodando a suíte e confirmando 112/0.

**Spec:** `docs/superpowers/specs/2026-06-14-mobile-responsivo-design.md`

---

## File Structure

- **Modify:** `css/cards.css` — acrescentar, no fim, blocos `@media` que reduzem `.carta`, `.coringa`, `.consumivel`, `.voucher`, `.slot-vazio` e fontes internas.
- **Modify:** `css/screens.css` — acrescentar, no fim, blocos `@media` que reorganizam a tela de rodada (grid → coluna), transformam `.lateral` em faixa horizontal, e aplicam `flex-wrap`/empilhamento nas telas de blinds, loja, cabeçalho e logo.
- **Modify:** `css/base.css` — acrescentar, no fim, bloco `@media` para overlays/tooltip/aviso globais.

Nenhum arquivo novo. A ordem das tasks (cards → screens → base) é independente; cada uma é autocontida e commitável sozinha.

---

## Task 1: Cartas e coringas responsivos (`css/cards.css`)

**Files:**
- Modify: `css/cards.css` (acrescentar ao fim do arquivo)
- Verify: `tests/todos.js`

- [ ] **Step 1: Confirmar baseline verde antes de mexer**

Run: `node tests/todos.js`
Expected: última linha `112 teste(s), 0 falha(s)`

- [ ] **Step 2: Acrescentar os blocos `@media` ao fim de `css/cards.css`**

Adicionar exatamente este conteúdo no FIM do arquivo (após a regra `.voucher`, linha ~127):

```css

/* ── Responsivo ───────────────────────────────── */
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

@media (max-width: 600px) {
  .carta { width: 52px; height: 72px; }
  .carta .pip { font-size: 1.5rem; }
  .carta .canto { font-size: 0.65rem; }
  .carta .canto { top: 3px; left: 4px; }
  .carta .canto.invertido { bottom: 3px; right: 4px; }
  .mao .carta { margin-left: -12px; }

  .coringa, .consumivel, .voucher, .slot-vazio {
    width: 72px;
    height: 94px;
  }
  .coringa, .consumivel, .voucher { font-size: 0.62rem; }
}
```

Notas para o executor:
- Os tamanhos do bloco `≤900px` são o passo intermediário (tablet); os do `≤600px` são o celular. Ambos coexistem: em 360px as duas regras se aplicam e a mais específica de largura (600) ganha porque vem depois no arquivo com mesma especificidade.
- Sanidade da mão em 360px: 1ª carta 52px + 7×(52−12) = 332px < 360px. Cabe.
- `.canto`/`.canto.invertido` ganham reposicionamento no celular porque o offset fixo de 5/6px fica grande demais numa carta de 52px.

- [ ] **Step 3: Confirmar que a suíte continua verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)` (CSS não afeta os testes; isto garante que nada quebrou por engano)

- [ ] **Step 4: Confirmar que os blocos foram adicionados**

Run: `grep -c "@media" css/cards.css`
Expected: `2`

- [ ] **Step 5: Commit**

```bash
git add css/cards.css
git commit -m "feat: cartas e coringas encolhem em tablet/celular (milestone #5)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Reorganização das telas (`css/screens.css`)

**Files:**
- Modify: `css/screens.css` (acrescentar ao fim do arquivo)
- Verify: `tests/todos.js`

- [ ] **Step 1: Acrescentar os blocos `@media` ao fim de `css/screens.css`**

Adicionar exatamente este conteúdo no FIM do arquivo (após `.rotulo-seletor`, linha ~162):

```css

/* ── Responsivo ───────────────────────────────── */
@media (max-width: 900px) {
  [data-tela="rodada"] { grid-template-columns: 240px 1fr; gap: 0.9rem; }
  .blinds { flex-wrap: wrap; justify-content: center; }
  .itens-loja { flex-wrap: wrap; justify-content: center; }
  .cabecalho-run { flex-wrap: wrap; justify-content: center; gap: 1rem; font-size: 1rem; }
}

@media (max-width: 600px) {
  [data-tela] { padding: 0.7rem; }

  /* Rodada: coluna única — .lateral (1º filho) sobe ao topo */
  [data-tela="rodada"] {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .lateral {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.7rem;
  }
  .painel-blind, .painel-pontuacao { flex: 1 1 45%; padding: 0.5rem; }
  #previa-mao { flex: 1 1 100%; min-height: 2rem; font-size: 0.95rem; }

  .mesa { min-height: auto; gap: 0.7rem; }
  .centro { min-height: 120px; }
  .topo { gap: 0.5rem; }

  /* Demais telas empilham */
  .cartao-blind { width: 100%; max-width: 320px; }
  .logo { font-size: 1.8rem; }
  .cabecalho-run { font-size: 0.9rem; gap: 0.7rem; }
  .tabela-maos { min-width: auto; width: 100%; }
}
```

Notas para o executor:
- A troca de `display: grid` para `display: flex; flex-direction: column` no `≤600px` sobrescreve o `grid-template-columns` do default — não precisa anular o grid explicitamente, o `display: flex` já o desativa.
- `.painel-blind`/`.painel-pontuacao` com `flex: 1 1 45%` ficam lado a lado dentro da faixa `.lateral` horizontal; `#previa-mao` com `flex: 1 1 100%` ocupa a linha inteira abaixo deles.
- `.mesa` perde o `min-height: 90vh` (vira `auto`) — senão a mesa sozinha empurra a mão para fora da tela no retrato.

- [ ] **Step 2: Confirmar que a suíte continua verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 3: Confirmar que os blocos foram adicionados**

Run: `grep -c "@media" css/screens.css`
Expected: `2`

- [ ] **Step 4: Commit**

```bash
git add css/screens.css
git commit -m "feat: telas reorganizam em coluna única no celular (milestone #5)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Overlays e elementos globais (`css/base.css`)

**Files:**
- Modify: `css/base.css` (acrescentar ao fim do arquivo)
- Verify: `tests/todos.js`

- [ ] **Step 1: Acrescentar o bloco `@media` ao fim de `css/base.css`**

Adicionar exatamente este conteúdo no FIM do arquivo (após a regra `#fundo`, linha ~110):

```css

/* ── Responsivo ───────────────────────────────── */
@media (max-width: 600px) {
  .painel-baralho { width: 90vw; padding: 1rem; font-size: 0.95rem; }
  #tooltip { max-width: 80vw; font-size: 0.8rem; }
  #aviso { max-width: 90vw; font-size: 0.95rem; padding: 0.5rem 0.9rem; }
  .botao-mini { padding: 0.3rem 0.6rem; }
}
```

Notas para o executor:
- `.botao` padrão (0.6rem × 1.4rem) já dá alvo de toque confortável (≥44px de altura), por isso não é alterado — só `.botao-mini` ganha um leve ajuste.
- O `.painel-baralho` (overlay de detalhe do baralho) tinha `max-width: 600px`; em 90vw cabe num celular de 360px.

- [ ] **Step 2: Confirmar que a suíte continua verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 3: Confirmar que o bloco foi adicionado**

Run: `grep -c "@media" css/base.css`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
git add css/base.css
git commit -m "feat: overlays e tooltip se ajustam ao celular (milestone #5)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Verificação final (após as 3 tasks)

- [ ] **Suíte verde:** `node tests/todos.js` → `112 teste(s), 0 falha(s)`.
- [ ] **Cobertura de media queries:** `grep -rc "@media" css/` deve mostrar `cards.css:2`, `screens.css:2`, `base.css:1` (5 blocos no total). `fonts.css` não muda.
- [ ] **Inspeção visual (pendente, requer browser):** abrir `index.html` e, no devtools, testar em larguras 360px, 768px e 1280px — confirmar que (a) a mão de 8 cartas não transborda nem rola horizontalmente em 360px; (b) a rodada vira coluna única com a info no topo em 360px; (c) blinds e itens de loja empilham/quebram sem estourar; (d) o desktop (1280px) permanece idêntico ao de hoje.
- [ ] **Merge:** seguir o fluxo do projeto — merge `--no-ff` em `main`, apagar a branch.

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:** todos os elementos citados no spec têm task — `.carta`/pip/canto/margin e `.coringa`/`.consumivel`/`.voucher`/`.slot-vazio` (Task 1); `[data-tela="rodada"]`/`.lateral`/`.mesa`/`.centro`/`.blinds`/`.itens-loja`/`.cabecalho-run`/`.logo`/`.tabela-maos` (Task 2); `#tooltip`/`.painel-baralho`/`.botao-mini`/`#aviso` (Task 3). Os breakpoints 900/600px batem com o spec.

**Placeholders:** nenhum — todo CSS está escrito por extenso, sem "TBD"/"ajustar depois" sem valor concreto.

**Consistência:** os tamanhos do `≤600px` em cards.css (52px carta, −12px margin) batem com a conta de sanidade do spec (332px). Os seletores usados existem no CSS atual (confirmado por leitura dos arquivos). O trailer de commit usa `Claude Fable 5` conforme a convenção do projeto.

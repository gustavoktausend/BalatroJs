# Polimento visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir três problemas visuais achados rodando o jogo no navegador: overflow horizontal no celular, espaço morto no centro da tela de rodada (desktop), e o 404 do favicon.

**Architecture:** Mudanças de CSS + uma reorganização de DOM na camada de UI (`js/ui/screens.js`), sem lógica de regras nova. A prévia da mão (`#previa-mao`) sai da lateral e vai para o `.centro`, virando irmã da área de animação (`#area-jogada`); como `atualizarControles` e `animarJogada` localizam ambos por `id`, a lógica não muda. O overflow é resolvido na raiz (slots menores + wrap) com `overflow-x: hidden` no body como rede de segurança. Favicon é SVG inline (data-URI), sem arquivo binário.

**Tech Stack:** CSS3 (flexbox, media queries), JS ES modules nativos, sem build, zero dependências. Harness de testes próprio (`node tests/todos.js`, Node 18+).

> **Nota sobre testes (importante):** este pacote não adiciona lógica de regras — é CSS e reorganização de DOM na UI. `js/ui/screens.js` é camada de UI (não calcula regras, por convenção do projeto) e não tem teste unitário; as funções que a prévia chama (`detectarMao`, `valoresDaMao`) já têm cobertura no engine. Portanto NÃO escreva testes JS novos. O contrato é: a suíte existente continua verde (`node tests/todos.js` → **112 teste(s), 0 falha(s)**) como guarda de regressão, e a validação real é VISUAL no navegador (seção final). Cada task roda a suíte e confirma 112/0.

**Spec:** `docs/superpowers/specs/2026-06-14-polimento-visual-design.md`

---

## File Structure

- **Modify:** `css/cards.css` — no bloco `@media (max-width: 600px)`, reduzir os slots de coringa/consumível de 72×94 para 56×74.
- **Modify:** `css/screens.css` — fix do `.topo`/`.coringas`/`.consumiveis` no `@media ≤600px`; trocar o estilo de `#previa-mao` (de lateral pequeno para central grande); remover a regra mobile `#previa-mao { flex: 1 1 100% … }`.
- **Modify:** `css/base.css` — `overflow-x: hidden` no body.
- **Modify:** `js/ui/screens.js` — mover `#previa-mao` da lateral para o `.centro`; separar `#area-jogada` num filho próprio.
- **Modify:** `index.html` — favicon SVG inline no `<head>`.

Ordem das tasks: 1 (overflow, CSS puro, baixo risco) → 2 (prévia central, JS+CSS, a substantiva) → 3 (favicon, trivial). Independentes e commitáveis isoladamente.

---

## Task 1: Corrigir overflow horizontal no celular

**Files:**
- Modify: `css/cards.css` (bloco `@media (max-width: 600px)`)
- Modify: `css/screens.css` (bloco `@media (max-width: 600px)`)
- Modify: `css/base.css`
- Verify: `tests/todos.js`

- [ ] **Step 1: Confirmar baseline verde**

Run: `node tests/todos.js`
Expected: última linha `112 teste(s), 0 falha(s)`

- [ ] **Step 2: Reduzir os slots no celular em `css/cards.css`**

No bloco `@media (max-width: 600px)`, trocar o tamanho dos slots. Substituir EXATAMENTE:

```css
  .coringa, .consumivel, .voucher, .slot-vazio {
    width: 72px;
    height: 94px;
  }
```

por:

```css
  .coringa, .consumivel, .voucher, .slot-vazio {
    width: 56px;
    height: 74px;
  }
```

(A linha seguinte `.coringa, .consumivel, .voucher { font-size: 0.62rem; }` permanece inalterada.)

Sanidade: 5 coringas × 56 + 4 gaps × ~6px = 304px < 360px — a fileira de coringas cabe numa linha; consumíveis quebram para a linha de baixo se necessário.

- [ ] **Step 3: Permitir wrap no `.topo` e fileiras em `css/screens.css`**

No bloco `@media (max-width: 600px)`, localizar a linha:

```css
  .topo { gap: 0.5rem; }
```

e substituí-la por:

```css
  .topo { gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
  .coringas, .consumiveis { flex-wrap: wrap; justify-content: center; }
```

- [ ] **Step 4: Rede de segurança em `css/base.css`**

Localizar a regra `body { … }` (começa em ~linha 19, tem `margin: 0; min-height: 100vh; …`). Adicionar a propriedade `overflow-x: hidden;` ao final do bloco `body`, logo após `user-select: none;`:

```css
  user-select: none;
  overflow-x: hidden;
}
```

- [ ] **Step 5: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 6: Validar no navegador (sem overflow em 360px)**

Servir e medir (servidor já pode estar de pé na porta 8123; se não, rode `python3 -m http.server 8123` no diretório do projeto). Abrir `http://localhost:8123/index.html`, jogar até a tela de rodada, redimensionar para 360px de largura, e avaliar via JS:

```js
() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })
```

Expected: `scroll <= client` (sem overflow horizontal). Se o controlador estiver usando chrome-devtools MCP, fazer isso; se não houver browser disponível, registrar como pendência visual e seguir (a suíte já garante a não-regressão de código).

- [ ] **Step 7: Commit**

```bash
git add css/cards.css css/screens.css css/base.css
git commit -m "fix: elimina overflow horizontal na rodada no celular (polish)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Prévia da mão grande no centro

**Files:**
- Modify: `js/ui/screens.js` (`renderRodada` ~linha 119, `painelLateral` ~linha 146)
- Modify: `css/screens.css` (regra `#previa-mao` ~linha 93; regra mobile ~linha 189)
- Verify: `tests/todos.js`

Contexto: hoje `renderRodada` cria `<div class="centro" id="area-jogada">` (o id de animação no próprio container) e `painelLateral` põe `<div id="previa-mao">` dentro do `.painel-pontuacao`. `atualizarControles` (linha 176) escreve em `#previa-mao` por id; `animarJogada` (linha 199) usa `#area-jogada` por id. Vamos só mudar ONDE esses dois ids vivem no DOM — a lógica que os usa não muda.

- [ ] **Step 1: Mover os ids no `renderRodada` (`js/ui/screens.js`)**

Localizar (linha ~119):

```js
      el("div", { classe: "centro", id: "area-jogada" }),
```

Substituir por um `.centro` com dois filhos irmãos:

```js
      el("div", { classe: "centro" },
        el("div", { id: "previa-mao" }),
        el("div", { id: "area-jogada" }),
      ),
```

- [ ] **Step 2: Remover `#previa-mao` da lateral (`js/ui/screens.js`)**

Em `painelLateral`, localizar (linha ~144-147):

```js
    el("div", { classe: "painel-pontuacao" },
      el("p", {}, "Rodada: ", el("span", { classe: "numero" }, rodada.pontuacao.toLocaleString("pt-BR"))),
      el("div", { id: "previa-mao" }),
    ),
```

Substituir por (sem o `#previa-mao`):

```js
    el("div", { classe: "painel-pontuacao" },
      el("p", {}, "Rodada: ", el("span", { classe: "numero" }, rodada.pontuacao.toLocaleString("pt-BR"))),
    ),
```

- [ ] **Step 3: Estilo central grande para `#previa-mao` (`css/screens.css`)**

Localizar (linha ~93-94):

```css
#previa-mao { min-height: 2.6rem; font-size: 1.05rem; }
#previa-mao .nome-mao { display: block; font-weight: 700; }
```

Substituir por:

```css
#previa-mao { text-align: center; font-size: 2rem; line-height: 1.4; }
#previa-mao:empty { display: none; }
#previa-mao .nome-mao { display: block; font-weight: 700; font-size: 1.6rem; }
#previa-mao .nome-mao small { font-size: 1rem; color: var(--texto-suave); }
```

(A prévia usa `.numero.chips` e `.numero.mult` para os valores, que já têm cor/fonte definidas em `base.css`; o `font-size: 2rem` no container amplia os números. `:empty { display: none }` evita ocupar espaço quando não há seleção.)

- [ ] **Step 4: Remover a regra mobile da prévia na lateral (`css/screens.css`)**

No bloco `@media (max-width: 600px)`, localizar e REMOVER inteira a linha (~189):

```css
  #previa-mao { flex: 1 1 100%; min-height: 2rem; font-size: 0.95rem; }
```

Substituir por uma regra que apenas reduz a fonte da prévia central no celular:

```css
  #previa-mao { font-size: 1.4rem; }
  #previa-mao .nome-mao { font-size: 1.1rem; }
```

- [ ] **Step 5: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 6: Validar no navegador**

Abrir o jogo, entrar numa rodada (desktop 1280px), selecionar 2-3 cartas. Confirmar via screenshot: o nome da mão + chips×mult aparecem GRANDES no centro da tela, e a lateral NÃO tem mais a prévia (só Alvo/Rodada/Mãos/Descartes/$/Ante). Desselecionar tudo → o centro fica vazio (`:empty` esconde). Jogar a mão → a animação ocorre em `#area-jogada` sem conflito. Se não houver browser, registrar pendência visual e seguir.

- [ ] **Step 7: Commit**

```bash
git add js/ui/screens.js css/screens.css
git commit -m "feat: prévia da mão grande no centro da rodada; lateral enxuta (polish)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Favicon SVG inline (elimina 404)

**Files:**
- Modify: `index.html` (`<head>`)
- Verify: `tests/todos.js`

- [ ] **Step 1: Adicionar o favicon inline no `<head>` (`index.html`)**

Localizar (linha 6):

```html
  <title>BalatroJS</title>
```

Inserir LOGO ABAIXO dela:

```html
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%231c3a27'/%3E%3Ctext x='8' y='12' font-size='11' font-family='monospace' font-weight='bold' text-anchor='middle' fill='%23fe5f55'%3EB%3C/text%3E%3C/svg%3E">
```

(SVG minúsculo: um quadrado verde-feltro `#1c3a27` com a letra "B" no vermelho do tema `#fe5f55`. Data-URI, sem arquivo binário. Os caracteres `<`, `>`, `#` e espaços estão percent-encoded como `%3C`, `%3E`, `%23`, ` ` para validade no atributo href.)

- [ ] **Step 2: Confirmar suíte verde**

Run: `node tests/todos.js`
Expected: `112 teste(s), 0 falha(s)`

- [ ] **Step 3: Validar no navegador (sem 404)**

Recarregar `http://localhost:8123/index.html` e listar mensagens do console / requests. Expected: NÃO há mais o erro `404 (File not found)` referente a `favicon.ico`; aparece o ícone "B" na aba. Se não houver browser, registrar pendência visual.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: favicon SVG inline elimina 404 no console (polish)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Verificação final (após as 3 tasks)

- [ ] **Suíte verde:** `node tests/todos.js` → `112 teste(s), 0 falha(s)`.
- [ ] **Navegador — mobile 360px:** `scrollWidth <= clientWidth` na rodada (sem overflow); screenshot da rodada mostra slots menores cabendo e a mão numa fileira.
- [ ] **Navegador — desktop 1280px:** ao selecionar cartas, a prévia (nome + chips×mult) aparece grande no centro; lateral sem a prévia; centro vazio quando nada selecionado.
- [ ] **Navegador — console:** sem o 404 do favicon; ícone "B" na aba.
- [ ] **Merge:** seguir o fluxo do projeto — branch de feature, merge `--no-ff` em `main`, apagar a branch. (O usuário decide push.)

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Item 1 (overflow): Task 1 cobre slots 56×74 (cards.css), `.topo`/coringas/consumiveis wrap (screens.css), `overflow-x: hidden` (base.css). ✓
- Item 2 (prévia central): Task 2 move `#previa-mao` para o `.centro`, separa `#area-jogada`, remove prévia da lateral, estiliza central grande, remove regra mobile antiga. ✓
- Item 3 (favicon): Task 3. ✓
- Validação no navegador: presente em cada task + seção final. ✓

**Placeholders:** nenhum — todo CSS/JS/HTML escrito por extenso, com antes/depois exatos.

**Consistência:** os ids `previa-mao` e `area-jogada` referenciados na Task 2 batem com os consumidores não-tocados (`atualizarControles` linha 176, `animarJogada` linha 199), ambos por `getElementById`. Os tamanhos do overflow (56px) batem com a conta de sanidade. Trailer de commit `Claude Fable 5` conforme convenção. Os trechos CSS a substituir foram confirmados por leitura: `screens.css:93-94`, `screens.css:189`, `cards.css:150-153`, `base.css` body, `index.html:6`.

# Design: Polimento visual (pós-milestone #5)

**Data:** 2026-06-14
**Status:** aprovado para planejamento

## Objetivo

Corrigir problemas visuais encontrados rodando o jogo no navegador (via
chrome-devtools MCP) após a milestone #5. Três itens, escolhidos pelo usuário
de um diagnóstico maior:

1. **Overflow mobile** (bug de regressão da #5) — rolagem horizontal de ~78px na
   tela de rodada no celular.
2. **Prévia da mão no centro** — reaproveitar o grande espaço vazio do centro da
   tela de rodada no desktop, movendo a prévia da mão (nome + chips×mult) da
   lateral para o centro, em tamanho grande.
3. **Favicon** — eliminar o 404 de `favicon.ico` que aparece no console.

Itens diagnosticados mas DEIXADOS DE FORA por decisão do usuário (ficam para
depois): legibilidade do `letter-spacing` nos selects do título; `aria-label`
nos selects/seed (a11y).

## Diagnóstico (medido no navegador)

- **Overflow:** em viewport estreita, `[data-tela="rodada"] .topo` usa
  `display: flex; justify-content: space-between`; os 7 slots de coringa/
  consumível (5 + 2) de 72px cada somam mais que a largura disponível →
  `scrollWidth` excede `clientWidth` em ~78px. Culpados medidos: `.consumiveis`
  e `.slot-vazio`.
- **Espaço morto desktop:** `.mesa` tem `min-height: 90vh` (720px em 800px de
  altura) e o `.centro` vazio ocupa ~433px, empurrando a mão para perto do
  rodapé. O `.centro` (`#area-jogada`) só é usado durante a animação da jogada;
  fica vazio o resto do tempo.
- **Favicon:** único 404 do console é o `favicon.ico` pedido automaticamente
  pelo navegador (todos os 32 assets do jogo carregam 200).

## Item 1 — Overflow mobile

Abordagem escolhida (**A**): encolher slots + permitir wrap (mesma filosofia da
#5: encolher, não rolar).

Mudanças:
- `css/screens.css`, bloco `@media (max-width: 600px)`:
  - `.topo` → trocar `justify-content: space-between` por
    `flex-wrap: wrap; justify-content: center; gap: 0.4rem`.
  - `.coringas`, `.consumiveis` → adicionar `flex-wrap: wrap; justify-content: center`.
- `css/cards.css`, bloco `@media (max-width: 600px)`:
  - `.coringa`, `.consumivel`, `.voucher`, `.slot-vazio` → de 72×94px para
    **56×74px**.
  - Conta de sanidade: 5 coringas × 56 + 4 gaps × ~6px = 304px < 360px (fileira
    de coringas cabe numa linha; consumíveis quebram para a linha de baixo se
    necessário).
- `css/base.css`:
  - `body { overflow-x: hidden; }` — rede de segurança barata contra estouros
    futuros de 1–2px (sugerido pelo revisor de qualidade da #5). Resolve-se o
    overflow na raiz; isto é apenas proteção.

## Item 2 — Prévia da mão no centro

Abordagem escolhida (**A**): mover o `#previa-mao` da lateral para o `.centro`.
Aproveita que `atualizarControles` já escreve em `#previa-mao` por id, então a
lógica JS quase não muda — só o local no DOM e o CSS de tamanho.

Estado atual do DOM da rodada (`js/ui/screens.js`):
- `renderRodada` monta `.centro` como `<div class="centro" id="area-jogada">`
  (linha 119) — id de animação no próprio container.
- `painelLateral` põe `<div id="previa-mao">` dentro do `.painel-pontuacao`
  (linha 146).
- `atualizarControles` (linha 176) busca `#previa-mao` por id e escreve o HTML
  da prévia; vazio quando `selecao.size === 0`.
- `animarJogada` (linha 199) usa `document.getElementById("area-jogada")`.

Mudanças:
- `renderRodada` (`screens.js`): o `.centro` deixa de carregar o id
  `area-jogada` e passa a conter **dois filhos irmãos**:
  ```
  el("div", { classe: "centro" },
    el("div", { id: "previa-mao" }),
    el("div", { id: "area-jogada" }),
  )
  ```
- `painelLateral` (`screens.js`): remover o `el("div", { id: "previa-mao" })`
  do `.painel-pontuacao`. A lateral fica só Rodada / Mãos / Descartes / $ / Ante.
- `atualizarControles` e `animarJogada`: **sem mudança** — continuam achando
  `#previa-mao` e `#area-jogada` por id (agora são irmãos no `.centro`).
- `css/screens.css`:
  - `#previa-mao` no centro: fonte grande — `.nome-mao` ~1.6rem; os números
    chips×mult ~2rem (fonte pixel via `.numero`). Centralizado.
  - O seletor antigo `#previa-mao { min-height: 2.6rem; font-size: 1.05rem; }`
    (que assumia a lateral) é substituído pelo estilo central grande.
  - Remover, do bloco `@media ≤600px`, a regra `#previa-mao { flex: 1 1 100%; … }`
    que existia para a lateral horizontal — não se aplica mais (a prévia saiu da
    lateral). No celular a prévia central só precisa encolher de fonte.

**Comportamento:** sem seleção → centro vazio (intencional, sem placeholder, por
escolha do usuário). Com seleção → nome + chips×mult grandes no centro. Durante a
jogada → `#area-jogada` anima; a prévia já esvaziou (a seleção foi consumida), sem
conflito visual.

## Item 3 — Favicon

Adicionar ao `<head>` de `index.html` um favicon **SVG inline via data-URI**
(mantém zero-dependências/self-hosted; combina com o ícone SVG inline dos
coringas). Um glifo simples no vermelho do tema (`--vermelho #fe5f55`), ex. um
naipe de espadas ou a letra "B". Elimina o 404 sem adicionar arquivo binário.

## Arquivos tocados

- `index.html` — favicon SVG inline no `<head>`.
- `js/ui/screens.js` — mover `#previa-mao` para o `.centro`; separar
  `#area-jogada` num filho próprio dentro do `.centro`.
- `css/screens.css` — estilo da prévia central grande; remover estilo antigo de
  prévia na lateral (incl. a regra mobile `flex: 1 1 100%`); fix
  `.topo`/`.coringas`/`.consumiveis` no `@media ≤600px`.
- `css/cards.css` — slots 56×74px no `@media ≤600px`.
- `css/base.css` — `overflow-x: hidden` no body.

## Não-objetivos (YAGNI)

- Sem redesenho do layout da rodada (posições de coringas/mesa permanecem).
- Sem placeholder/dica no centro quando ocioso.
- Sem mudança no shape do `state` nem no save (`VERSAO_SAVE` permanece 4).
- Sem labels de a11y nem ajuste de letter-spacing dos selects (fora deste pacote).
- Sem nova lógica de regras de jogo.

## Testes e validação

- **Suíte automatizada:** mudança é CSS + reorganização de DOM na camada de UI,
  sem lógica de regras nova. `screens.js` é UI (não calcula regras, convenção do
  projeto) e não tem teste unitário hoje; as funções que a prévia chama
  (`detectarMao`, `valoresDaMao`) já são cobertas no engine. A suíte
  (`node tests/todos.js`, baseline **112 testes, 0 falhas**) é a guarda de
  regressão e deve continuar verde.
- **Validação no navegador (chrome-devtools MCP)** — desta vez possível de fato:
  - Mobile 360px: confirmar `document.documentElement.scrollWidth ===
    clientWidth` (sem overflow) + screenshot da rodada.
  - Desktop 1280px: selecionar cartas e confirmar a prévia grande no centro +
    lateral enxuta (sem `#previa-mao`) via screenshot.
  - Console: confirmar que o 404 do favicon sumiu.

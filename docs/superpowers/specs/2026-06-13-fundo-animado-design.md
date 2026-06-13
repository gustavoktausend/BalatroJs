# Fundo animado (blobs no canvas) — BalatroJS

Data: 2026-06-13
Milestone: #1 do roadmap (`2026-06-12-balatro-clone-design.md`).

## Objetivo

Substituir o gradiente radial estático do `body` por um fundo animado de "blobs" de cor
em movimento lento (efeito *lava lamp* suave), num `<canvas>` atrás da UI. Puramente
decorativo: zero impacto no engine, no estado da run, no RNG com seed ou no save.

## Escopo

- Canvas de fundo cobrindo a viewport, atrás de `#app`.
- N blobs (manchas circulares borradas) em tons do feltro da paleta, deslocando-se
  devagar e quicando nas bordas.
- Loop via `requestAnimationFrame`.
- Respeita `prefers-reduced-motion: reduce` → desenha um único quadro estático.
- Aleatoriedade decorativa via `Math.random` (NÃO usa o RNG com seed do jogo).

## Não-escopo

- Botão liga/desliga na UI (descartado no brainstorm).
- Partículas de naipe / outros estilos visuais.
- Determinismo por seed.
- Qualquer mudança em gameplay, save ou engine.

## Arquitetura

Novo módulo `js/ui/fundo.js`, isolado: não importa de `engine/`, não lê `state`.

- `index.html`: adicionar `<canvas id="fundo"></canvas>` como primeiro filho do `<body>`,
  antes de `<main id="app">`.
- `css/base.css`: estilizar `#fundo` com `position: fixed; inset: 0; z-index: -1;
  pointer-events: none;`. O `body` mantém o gradiente radial atual como fundo-base
  (fallback se o canvas não pintar).
- `js/main.js`: importar e chamar `iniciarFundo()` uma vez no boot.

### Interface de `js/ui/fundo.js`

- `iniciarFundo()` — ponto de entrada. Pega `#fundo`, obtém contexto 2D, dimensiona o
  canvas para `window.innerWidth/Height` (com listener de `resize` que redimensiona e
  reposiciona os blobs dentro dos novos limites), cria os blobs e inicia a animação.
  Se `#fundo` não existir ou `getContext("2d")` retornar falso, retorna sem fazer nada
  (o gradiente do `body` continua valendo).
- `passo(blob, dt, limites)` — **função pura exportada** (para teste): recebe um blob
  `{ x, y, vx, vy, raio }`, um delta de tempo `dt` e `limites { largura, altura }`;
  retorna um novo blob com posição avançada por `dt` e velocidade refletida se bateu
  numa borda (quique: inverte `vx`/`vy` e fixa a posição na borda). Não muta a entrada.

### Modelo de um blob

`{ x, y, vx, vy, raio, cor }` — posição em px, velocidade em px/s, raio em px, cor em
string CSS (tons de `--feltro-claro` / `--feltro-escuro`, com alfa baixo). Quantidade:
~5 blobs grandes. Desenho: `ctx.filter = "blur(...)"` + `radialGradient` por blob, sobre
um `clearRect`/preenchimento de fundo a cada quadro.

## Fluxo

Boot → `iniciarFundo()` cria blobs (Math.random) → se reduced-motion, desenha 1 quadro e
para; senão, `requestAnimationFrame` chama o loop que, a cada quadro: calcula `dt`,
aplica `passo` a cada blob, limpa e redesenha. O loop é independente das trocas de tela
da UI (que mexem só em `#app`).

## Tratamento de erros

- Sem `#fundo` ou sem contexto 2D → `iniciarFundo()` é no-op; fundo CSS permanece.
- Nada persiste; nada pode corromper save.

## Testes

`tests/fundo.test.js` (novo, importado em `tests/todos.js`): cobre `passo` (lógica pura),
sem tocar em canvas/DOM:
- avança a posição conforme `vx/vy` e `dt` quando dentro dos limites;
- quica na borda esquerda/direita (inverte `vx`, x fica ≥ 0 / ≤ largura) e topo/base
  (inverte `vy`);
- não muta o blob de entrada (retorna novo objeto).

O desenho e o respeito a `prefers-reduced-motion` são verificação manual no navegador
(sem browser neste ambiente — registrar como pendência visual).

## Critérios de sucesso

1. O fundo mostra blobs de cor se movendo lentamente atrás da UI, sem atrapalhar a
   leitura das telas.
2. Com `prefers-reduced-motion: reduce`, o fundo fica estático (sem loop).
3. `passo` é testada e os testes passam (`node tests/todos.js`, total > 72, 0 falhas).
4. Nenhuma mudança no comportamento de gameplay, save ou RNG.

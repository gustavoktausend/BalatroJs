# Melhorias de UI: tabela de mãos + ícone SVG dos coringas — BalatroJS

Data: 2026-06-14
Tipo: melhoria de UI (fora do roadmap numerado; pedido direto do usuário).

## Objetivo

Duas melhorias de interface coesas:

1. **Tabela de mãos de pôquer** — um overlay acessível de qualquer tela de jogo, mostrando
   as 9 mãos com nível e chips × mult já com o nível da run aplicado (como o menu do
   Balatro original).
2. **Ícone SVG de coringa** — cada carta de Coringa passa a exibir um ícone de chapéu de
   jester, colorido de forma determinística pelo `id` do coringa, para identificá-los
   visualmente. O nome continua em texto abaixo do ícone.

Nenhuma regra de jogo muda. Tudo é apresentação.

## Escopo

### Tabela de mãos
- Botão **"Mãos"** no `cabecalhoRun(state)` (aparece em seleção-de-blind, rodada e loja).
- Clique abre um overlay (reusa o padrão de `mostrarBaralho`: `.overlay` que fecha ao
  clicar fora).
- Conteúdo: as 9 mãos na ordem de `MAOS`, cada linha com nome, nível atual
  (`state.niveisMaos[tipo]`) e chips × mult de `valoresDaMao(tipo, nivel)`.

### Ícone SVG do coringa
- Cor derivada do `id` por hash (função pura `corDoCoringa(id)`), sem novos dados nos
  coringas.
- SVG simples de chapéu de jester (silhueta com 2-3 pontas e guizos), 2 tons da cor.
- Aparece no topo do card; nome em `<span class="nome">` abaixo. Borda/fundo por raridade,
  botão vender e drag permanecem intactos.
- Aparece em todo card de coringa (fileira, item de loja, opção de pacote), inclusive
  quando renderizado sem interação (`indice === null`).

## Não-escopo

- Nenhuma mudança em regras, save, RNG ou pontuação.
- Não trocar os naipes (♥♦♠♣) por SVG — só o coringa.
- Sem ícones para Planeta/Tarô/Espectral nesta entrega.
- Tabela de mãos não mostra contagem de vezes jogada (descartado no brainstorm).

## Arquitetura

### `js/data/jokers.js` — `corDoCoringa(id)` (pura, exportada)

- Faz um hash determinístico da string `id` (ex.: acumulador estilo djb2 / soma de
  charCodes) → inteiro.
- Deriva um matiz `H = hash % 360`.
- Retorna `{ clara, escura }` como strings HSL:
  - `clara`: `hsl(H, 65%, 60%)` (corpo do ícone)
  - `escura`: `hsl(H, 65%, 35%)` (contorno/sombra) — mesma matiz/saturação, lightness menor.
- Determinística: mesmo `id` → mesmas cores. Nunca lança.

### `js/ui/render.js`

- `svgCoringa(clara, escura)` → elemento `<svg>` criado via `document.createElementNS`
  (SVG exige namespace; o helper `el()` usa `createElement` e não serve para SVG).
  `viewBox` fixo (ex.: `0 0 48 48`); um chapéu de jester com pontas e guizos, usando
  `clara` no preenchimento e `escura` no contorno/detalhes. Sem texto dentro do SVG.
- `elementoCoringa(coringa, indice)`: inserir `svgCoringa(...)` (com cores de
  `corDoCoringa(def.id)`) como primeiro filho do card, antes do `<span class="nome">`.
  Manter raridade, tooltip, venda e drag exatamente como estão.
- `cabecalhoRun(state)`: acrescentar um botão "Mãos" (classe de botão existente,
  `botao botao-mini`) cujo `onclick` chama `mostrarTabelaMaos(state)`.
  `mostrarTabelaMaos` vem de `screens.js`; para evitar import circular render↔screens,
  passar a função como já se faz com outros pontos, OU expor `mostrarTabelaMaos` de um
  módulo que render possa importar. **Decisão:** `mostrarTabelaMaos` fica em `screens.js`
  e `cabecalhoRun` recebe a referência via um pequeno registro no objeto `app`
  (`app.mostrarTabelaMaos`), definido no boot — espelhando como `app.renderizar` já é
  injetado em `main.js`/`screens.js`. Assim render.js não importa screens.js.

### `js/ui/screens.js` — `mostrarTabelaMaos(state)`

- Cria um `.overlay` (como `mostrarBaralho`) com um painel contendo a tabela das 9 mãos.
- Cada linha: nome (`MAOS[tipo].nome`), `nv. N`, e `chips × mult` de
  `valoresDaMao(tipo, state.niveisMaos[tipo])`.
- Fecha ao clicar no overlay (mesmo handler do baralho).
- No boot, registrar `app.mostrarTabelaMaos = mostrarTabelaMaos` (em `main.js`, junto de
  `app.renderizar = mostrarTela`).

### CSS

- `css/cards.css`: `.coringa` passa a empilhar conteúdo em coluna (ícone em cima, nome
  embaixo) — `flex-direction: column; justify-content: space-between;`. Dimensionar
  `.coringa svg` (ex.: largura ~70% do card, altura automática). O `.consumivel` não muda.
- `css/screens.css`: `.tabela-maos` (grid/lista) com linhas legíveis, reusando as cores
  `.chips`/`.mult` da paleta.

## Fluxo

- Tabela: qualquer tela de jogo → botão "Mãos" → overlay com a tabela (valores atuais) →
  clique fora fecha.
- Ícone: ao renderizar qualquer coringa, `corDoCoringa(def.id)` dá as cores e
  `svgCoringa` desenha o ícone no topo do card.

## Tratamento de erros

- `corDoCoringa` nunca lança (qualquer string vira hash).
- `svgCoringa` é determinística pelas cores recebidas; sem estado.
- Overlay sem estado persistente; fecha ao clicar fora.

## Testes

`tests/data.test.js` (acrescentar casos para `corDoCoringa`):
- determinismo: `corDoCoringa("coringa")` === `corDoCoringa("coringa")`;
- formato: retorna `{clara, escura}` com strings começando em `hsl(`;
- escura mais escura que clara: extrair a lightness de cada e checar `escura < clara`;
- espalhamento: alguns ids distintos (ex.: "coringa", "ganancioso", "obelisco") dão
  matizes diferentes entre si.

Sem teste automatizado para SVG/overlay (visual). Smoke headless: `render.js`/`screens.js`
carregam; `svgCoringa("hsl(0,1%,1%)","hsl(0,1%,1%)")` retorna um nó cujo `tagName` é
`svg` (sob shim de DOM com `createElementNS`).

## Critérios de sucesso

1. Botão "Mãos" abre um overlay com as 9 mãos, nível e chips × mult atuais; fecha ao
   clicar fora.
2. Cada card de coringa mostra um ícone de jester colorido pelo id, com o nome abaixo;
   raridade, venda e drag continuam funcionando.
3. Coringas diferentes têm cores visivelmente diferentes; o mesmo coringa tem sempre a
   mesma cor.
4. `node tests/todos.js` passa, com os novos testes de `corDoCoringa` (total > 91, 0
   falhas).

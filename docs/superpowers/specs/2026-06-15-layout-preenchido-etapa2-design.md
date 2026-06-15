# Design: Layout preenchido — Etapa 2 (cartas maiores + baralho no canto)

**Data:** 2026-06-15
**Status:** aprovado para planejamento

## Contexto

Continuação da reformulação do layout da tela de rodada, dividida em duas etapas
na spec da Etapa 1 (`docs/superpowers/specs/2026-06-14-layout-preenchido-etapa1-design.md`):

- **Etapa 1 (concluída, mergeada):** lateral densa em cartuchos + chips×mult em
  caixas grandes na lateral.
- **Etapa 2 (este spec):** cartas da mão maiores + verso de baralho (com contagem)
  no canto inferior direito da mesa.

**Fidelidade:** "inspirado" — replicar a ESTRUTURA do layout do Balatro mantendo a
paleta e as fontes atuais do BalatroJS. Sem copiar pixel-art, fontes ou assets.

## Abordagem escolhida (A)

Só camada de UI; engine, shape do `state` e save **intocados**. Três frentes:

1. Aumentar as cartas da mão em `css/cards.css` (e proporcionalmente os
   breakpoints e o overlap).
2. Adicionar um verso de baralho no canto inferior direito da mesa, montado por uma
   nova função `versoBaralho(state)` em `js/ui/screens.js` e estilizado em
   `css/screens.css`.
3. Remover o botão `"Baralho: N"` dos `.controles`: o verso assume o clique que
   abre o overlay de cartas restantes (`mostrarBaralho`, já existente).

Descartadas: animar a compra do topo do baralho (YAGNI, fora do escopo); usar
assets/imagens de verso (queremos CSS puro, zero asset, paleta atual).

## Arquivos tocados

- `css/cards.css` — aumentar `.carta` de 72×100 → **88×122px**; reajustar os
  breakpoints `@media (max-width: 900px)` e `@media (max-width: 600px)`
  proporcionalmente; aumentar o overlap `.mao .carta { margin-left }` para 8 cartas
  continuarem cabendo. `.pip`/`.canto` acompanham o tamanho maior.
- `css/screens.css` — `.mesa` ganha `position: relative`; novo bloco para o verso
  (`.baralho-canto`, `.pilha-verso`, `.verso-carta`, `.baralho-contagem`); ajuste
  responsivo do canto a ≤600px.
- `js/ui/screens.js` — nova função `versoBaralho(state)`; inseri-la na `.mesa`
  (depois da `.base`); **remover** o botão `"Baralho: N"` da fileira `.controles`
  (linha ~129). O `.baralho-canto` chama `mostrarBaralho(state)` no clique.

**Sem novos arquivos. Sem mudança de dados. `mostrarBaralho` é reusado tal como
está.**

## Cartas maiores (`css/cards.css`)

| Breakpoint | Antes (l×a) | Depois (l×a) | Overlap `margin-left` (antes → depois) |
|---|---|---|---|
| Desktop   | 72×100 | **88×122** | −16px → **−20px** |
| ≤900px    | 62×86  | **76×106** | −14px → **−18px** |
| ≤600px    | 52×72  | **60×84**  | −12px → **−14px** |

- `.pip` (símbolo central) e `.canto` (rótulo) sobem um pouco de `font-size` para
  acompanhar a carta maior, mantendo a proporção atual.
- As cartas continuam um pouco menores que os coringas/consumíveis do topo
  (96×124), preservando a hierarquia visual.
- O overlap maior compensa a largura extra para que 8 cartas na mão não estourem a
  base no desktop estreito.

## Verso do baralho no canto

### Estrutura DOM (`versoBaralho(state)`)

```html
<div class="baralho-canto" title="Ver cartas restantes">   <!-- clicável -->
  <div class="pilha-verso">
    <div class="verso-carta" aria-hidden="true"></div>      <!-- 3 versos -->
    <div class="verso-carta" aria-hidden="true"></div>          empilhados
    <div class="verso-carta" aria-hidden="true"></div>
  </div>
  <div class="baralho-contagem">
    <span class="numero">38</span><span class="barra">/52</span>
  </div>
</div>
```

Inserido na `.mesa`, depois da `.base`. O `.baralho-canto` inteiro tem
`onclick: () => mostrarBaralho(state)`.

### Posicionamento

- `.mesa { position: relative }`.
- `.baralho-canto { position: absolute; right: 0; bottom: 0 }` — ancorado no canto
  inferior direito, sobre o feltro, sem empurrar a mão/controles (que permanecem
  centrados).
- `cursor: pointer` + `:hover` leve (`translateY(-2px)` na `.pilha-verso`) para
  sinalizar interatividade.

### Aparência (padrão diagonal, CSS puro)

Cada `.verso-carta` tem o mesmo tamanho das cartas da mão no breakpoint atual
(88×122 no desktop), `border-radius: 8px`, e:
- fundo `--vermelho-escuro`;
- `repeating-linear-gradient` de listras douradas sutis (≈10% de opacidade) a 45°;
- borda clara translúcida (derivada de `--texto`);
- moldura interna via `box-shadow inset`.

As 3 cópias deslocam `top`/`left` em passos de ~3px (`.verso-carta:nth-child(2/3)`)
para dar profundidade de pilha.

### Contagem

`38/52` abaixo da pilha, em fonte pixel (`.numero`), com a parte `/52` em
`--texto-suave`. Valores:
- numerador = `state.rodada.baralho.length` (cartas no monte);
- denominador = **total da rodada** = `state.rodada.mao.length +
  state.rodada.baralho.length`.

O total é calculado assim (não hardcode "52") para permanecer correto se um baralho
futuro tiver tamanho diferente. Hoje `criarBaralho()` sempre gera 52 e nada
remove/adiciona cartas, então exibe `52` na prática.

## Responsivo (mobile ≤600px)

- `.verso-carta` usa o mesmo tamanho das cartas em cada breakpoint (88/76/60 de
  largura), encolhendo junto.
- A ≤600px o canto absoluto poderia colidir com cartas/controles na tela estreita:
  a pilha encolhe e cola no canto inferior direito com `bottom`/`right` pequenos.
  **Validar a 360px** que não há sobreposição ruim nem overflow horizontal.

## Cores (paleta atual em base.css :root)

- Verso: fundo `--vermelho-escuro`; listras em `--dourado` com baixa opacidade;
  borda translúcida derivada de `--texto`.
- Contagem: número em fonte pixel (`.numero`); `/total` em `--texto-suave`.

## Não-objetivos

- Animação de "comprar do topo do baralho" — a pilha é estática; só a contagem muda
  ao re-renderizar.
- Virar carta / mostrar a face do topo.
- Sem mudança no shape do `state` nem no save (`VERSAO_SAVE` permanece).
- Sem nova lógica de regras de jogo (UI apenas).
- Sem copiar assets/fontes/pixel-art do original.

## Testes e validação

- **Suíte automatizada:** CSS + reorganização de DOM na UI, sem regra nova.
  `screens.js` é UI (não calcula regras) e não tem teste unitário. A suíte
  (`node tests/todos.js`, baseline **112 testes, 0 falhas**) é guarda de regressão e
  deve continuar verde. NÃO escrever testes JS novos.
- **Validação no navegador (chrome-devtools MCP):**
  - Desktop 1280px: cartas da mão visivelmente maiores e legíveis; verso de baralho
    no canto inferior direito com a pilha de padrão diagonal e a contagem `38/52`;
    clicar no verso abre o overlay de cartas restantes; o botão "Baralho: N" sumiu
    dos controles.
  - Mobile 360px: `scrollWidth === clientWidth` (sem overflow horizontal); verso no
    canto sem sobreposição feia das cartas/controles; cartas maiores ainda cabem na
    base com o overlap.

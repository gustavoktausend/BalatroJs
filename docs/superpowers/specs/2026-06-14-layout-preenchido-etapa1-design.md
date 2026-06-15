# Design: Layout preenchido — Etapa 1 (lateral densa + chips×mult em destaque)

**Data:** 2026-06-14
**Status:** aprovado para planejamento

## Contexto

Rodando o jogo no navegador e comparando com um screenshot do Balatro original, a
tela de rodada do BalatroJS tem muito espaço morto: a lateral é enxuta (`<p>`
soltos com vazio embaixo) e o chips×mult aparece pequeno. No original a lateral é
densa, em "cartuchos" coloridos que preenchem a altura, com o chips×mult em caixas
grandes (azul × vermelho).

O usuário escolheu reformular o layout em **duas etapas**:
- **Etapa 1 (este spec):** lateral densa em cartuchos + chips×mult em caixas
  grandes (na lateral).
- **Etapa 2 (spec futuro):** cartas maiores + baralho (verso + contagem) no canto
  inferior direito.

**Fidelidade:** "inspirado" — replicar a ESTRUTURA do layout do Balatro mantendo a
paleta e as fontes atuais do BalatroJS. Sem copiar pixel-art, fontes ou assets.

## Decisão importante: prévia volta para a lateral

No polimento anterior (commit bb210bb) a prévia da mão (`#previa-mao`) foi movida da
lateral para o centro. No layout do original o chips×mult fica na LATERAL, então a
Etapa 1 **reverte** essa decisão: `#previa-mao` volta para a lateral (agora dentro
de um cartucho dedicado, em caixas grandes), e o `.centro` volta a hospedar só
`#area-jogada` (animação da jogada). O trabalho anterior não foi perdido — ensinou
a estrutura e o fix de empilhamento das cartas jogadas (commit 2956f01) permanece.

## Abordagem escolhida (A)

Reescrever `painelLateral` em `js/ui/screens.js` para emitir blocos semânticos
("cartuchos"), cada um com classe própria, estilizados em `css/screens.css`. Mexe
só na camada de UI (engine intocado). A prévia reaproveita `#previa-mao` por id;
`atualizarControles` continua preenchendo esse elemento.

Descartadas: B (só CSS sobre os `<p>` atuais — granularidade insuficiente para as
caixas); C (helper `cartucho()` genérico — YAGNI para 5 cartuchos distintos).

## Estrutura da lateral em cartuchos

```
┌─────────────────────────┐
│      APOSTA PEQUENA      │ ← .cartucho-blind (cabeçalho destacado)
├─────────────────────────┤
│  ●   Pontue pelo menos   │ ← .cartucho-alvo: ícone + alvo + recompensa
│ blind   300   p/ +$3     │   (fundo amber discreto derivado de --dourado)
├─────────────────────────┤
│  Pontuação da rodada     │ ← .cartucho-score: número grande (fonte pixel)
│         1.250            │
├─────────────────────────┤
│  Two Pair          nv.1  │ ← .cartucho-mao: nome + nível + caixas
│  ┌────────┐  ┌────────┐  │
│  │   40   │×│   2    │  │ ← #previa-mao: .chips (azul) × .mult (vermelho)
│  └────────┘  └────────┘  │
├─────────────────────────┤
│  Mãos  Descartes         │ ← .cartucho-contadores (grade 2×2)
│   3       2              │
│  $22    Ante 2/8         │
└─────────────────────────┘
```

Cartuchos (cada um com classe própria):
- `.cartucho-blind` — nome do blind; chefe em `--vermelho`.
- `.cartucho-alvo` — ícone do blind + "Pontue pelo menos **N**" + recompensa.
  Para chefe, inclui a descrição do efeito (hoje em `.painel-blind`). Fundo amber
  discreto (`rgba(245,185,66,0.12)` + borda dourada).
- `.cartucho-score` — rótulo "Pontuação da rodada" + número grande (era "Rodada: N").
- `.cartucho-mao` — rótulo "Mão atual"/nome + nível + `#previa-mao` com as caixas.
- `.cartucho-contadores` — grade 2×2: Mãos / Descartes / $ / Ante.

## Caixas chips×mult e estado ocioso

A estrutura HTML que `atualizarControles` gera para a prévia **não muda**:
```
<span class="nome-mao">Two Pair <small>nv. 1</small></span>
<span class="numero chips">40</span> × <span class="numero mult">2</span>
```
O CSS estiliza `#previa-mao .chips` e `#previa-mao .mult` como caixas grandes
(fundo azul-escuro / vermelho-escuro, padding, border-radius, fonte pixel grande,
número branco). `.nome-mao` fica na linha de cima.

**Estado ocioso (nada selecionado):** hoje `atualizarControles` faz
`previa.replaceChildren()` (esvazia) quando `selecao.size === 0`. No cartucho isso
deixaria as caixas sumirem (feio). Ajuste em `atualizarControles`: no ramo
`selecao.size === 0`, em vez de `previa.replaceChildren()`, escrever um estado
neutro — nome "—" e caixas "0 × 0" com a classe `.previa-ociosa` no `#previa-mao`
(o CSS usa essa classe para apagar a cor das caixas). É UI pura, sem regra nova;
reutiliza as classes `.chips`/`.mult`. O ramo de seleção (que escreve a prévia
real) remove `.previa-ociosa`.

**Decisão sobre `aoJogar` (fixada, sem ambiguidade):** REMOVER o
`document.getElementById("previa-mao").replaceChildren()` que foi adicionado em
`aoJogar` no polimento. Ele existia para liberar o CENTRO durante a animação; agora
a prévia voltou para a LATERAL e não colide com `#area-jogada`. Após a jogada,
`atualizar()` re-renderiza e `atualizarControles` repõe o estado ocioso na lateral
naturalmente.

## Cores (paleta atual em base.css :root)

- Cartuchos: fundo `--painel` / `--painel-claro`, borda `--painel-borda`.
- `.cartucho-alvo`: fundo `rgba(245,185,66,0.12)`, borda `--dourado`.
- `.cartucho-blind`: `--painel-claro`; nome destacado; chefe em `--vermelho`.
- Caixa `.chips`: fundo `--azul-escuro`; caixa `.mult`: fundo `--vermelho-escuro`;
  número branco (`--texto`), fonte pixel.
- Estado ocioso: caixas em tom apagado (opacidade reduzida ou cor suave).

## Responsivo (mobile ≤600px)

A lateral já vira faixa horizontal no topo (milestone #5). Os cartuchos se
reorganizam nessa faixa: cartuchos em linha com `flex-wrap`, caixas chips×mult
menores. Detalhe no `@media (max-width: 600px)` de `screens.css`. **Validar a 360px
no navegador** — é onde mais pode quebrar (risco de overflow).

## Arquivos tocados

- `js/ui/screens.js` — reescrever `painelLateral` em cartuchos; mover `#previa-mao`
  para o `.cartucho-mao`; `#area-jogada` volta a ser filho único do `.centro`;
  ajustar `atualizarControles` para estado ocioso neutro.
- `css/screens.css` — estilos dos cartuchos + caixas chips×mult. As regras de
  `#previa-mao` central do polimento (linhas 93-96) precisam ser refeitas para o
  contexto da lateral:
  - linha 93 (`#previa-mao { text-align:center; font-size:2rem; line-height:1.4 }`):
    substituir pelo estilo de lateral/cartucho.
  - linha 94 (`#previa-mao:empty, #area-jogada:empty { display: none; }`): é
    COMPARTILHADA. Remover só a parte `#previa-mao:empty` (a prévia agora nunca
    fica vazia — vira estado ocioso); **PRESERVAR `#area-jogada:empty { display:
    none; }`** (continua válido para a animação). Resultado: a regra fica
    `#area-jogada:empty { display: none; }`.
  - linhas 95-96 (`.nome-mao` central): reajustar para o tamanho da lateral.
  - Ajustar também o `@media (max-width: 600px)` (regras `#previa-mao` mobile).

## Não-objetivos

- Cartas maiores e baralho no canto — Etapa 2.
- Sem mudança no shape do `state` nem no save (`VERSAO_SAVE` permanece 4).
- Sem nova lógica de regras de jogo (UI apenas).
- Sem copiar assets/fontes/pixel-art do original.

## Testes e validação

- **Suíte automatizada:** CSS + reorganização de DOM na UI, sem regra nova.
  `screens.js` é UI (não calcula regras) e não tem teste unitário; as funções de
  prévia (`detectarMao`, `valoresDaMao`) já têm cobertura no engine. A suíte
  (`node tests/todos.js`, baseline **112 testes, 0 falhas**) é guarda de regressão
  e deve continuar verde.
- **Validação no navegador (chrome-devtools MCP):**
  - Desktop 1280px: screenshot da lateral preenchida em cartuchos; caixas
    chips×mult ao selecionar cartas; estado ocioso neutro (sem cartucho vazio feio).
  - Mobile 360px: lateral horizontal no topo, `scrollWidth === clientWidth` (sem
    overflow), cartuchos legíveis.
  - Jogar uma mão: o centro anima as cartas em fileira (fix do commit 2956f01
    preservado); prévia limpa/ociosa após a jogada.

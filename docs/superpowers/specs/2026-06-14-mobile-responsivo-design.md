# Design: Layout mobile/responsivo (milestone #5)

**Data:** 2026-06-14
**Status:** aprovado para planejamento

## Objetivo

Tornar o BalatroJS jogável e legível de celular retrato (~360px) até desktop
largo, passando por tablet. Hoje o CSS usa larguras fixas em px em todos os
elementos, sem nenhuma media query — a tela de rodada (grid `280px 1fr`) e a mão
de 8 cartas (~470px) transbordam em telas estreitas.

## Decisões de design

- **Alvo:** celular retrato (~360–414px) → tablet → desktop. Suporte completo.
- **Mão de cartas:** encolher + sobrepor mais (mantém o leque clássico, sem
  rolagem horizontal nem quebra em duas linhas).
- **Técnica:** breakpoints `@media` puros (sem `clamp()`/`vw`). Previsível,
  testável, alinhado ao "CSS puro, sem build, zero dependências" do projeto.
- **Organização:** cada `@media` no fim do arquivo CSS do seu domínio
  (`cards.css`, `screens.css`, `base.css`), perto dos seletores que modifica.
- **Sem JS, sem mudança de HTML.** Respeita a arquitetura: engine não toca DOM,
  UI não calcula layout, layout é responsabilidade do CSS. O `<meta viewport>` já
  existe no `index.html`.

## Abordagem escolhida

**Abordagem A — Lateral vira topo empilhado.** No breakpoint celular a tela de
rodada deixa de ser grid de 2 colunas e vira coluna única; o painel `.lateral`
(que é o **primeiro filho** no HTML da rodada) sobe naturalmente para o topo como
faixa horizontal compacta. É por isso que não precisa de JS para remontar o DOM.

Abordagens descartadas: barra fixa no rodapé (sobrepõe conteúdo, frágil) e
reorganização via JS (viola a separação UI/CSS, desnecessária).

## Breakpoints

| Faixa | Largura | O que muda |
|-------|---------|------------|
| **Desktop** | `> 900px` | default atual — CSS de hoje permanece intacto |
| **Tablet** | `≤ 900px` | rodada continua 2 colunas mas estreita; cartas/coringas em passo intermediário; telas com `flex-wrap` |
| **Celular** | `≤ 600px` | rodada vira coluna única (lateral → topo); cartas/coringas encolhem mais; ajustes de toque/fonte |

O CSS de desktop é o default; as `@media (max-width: …)` ajustam para baixo, sem
reescrever o existente.

## Tela de rodada no celular (≤600px)

Layout em coluna única, de cima para baixo:

```
┌─────────────────────────────┐
│  FAIXA DE INFO (era .lateral)│  ← compacta, horizontal
│  Blind: alvo 🔵  | Pont. atual│
│  Mãos: N · Descartes: N · $N │
├─────────────────────────────┤
│  coringas        consumíveis │  ← .topo, encolhidos
├─────────────────────────────┤
│      MESA / placar-jogada    │  ← .centro
├─────────────────────────────┤
│      🂡🂢🂣🂤🂥🂦🂧🂨            │  ← .mao (cartas menores, +sobrepostas)
│   [Jogar]  [Descartar]       │  ← .controles
└─────────────────────────────┘
```

Mudanças em `screens.css` (bloco `@media (max-width: 600px)`):

- `[data-tela="rodada"]` → de `grid` para `display: flex; flex-direction: column;`.
  A `.lateral` (1º filho) sobe ao topo automaticamente.
- `.lateral` → faixa horizontal: `flex-direction: row; flex-wrap: wrap;` com
  `padding`/`gap` menores. `.painel-blind` e `.painel-pontuacao` ficam lado a lado
  (economiza altura vertical, recurso escasso no retrato).
- `.mesa` → `min-height: 90vh` vira `min-height: auto` (senão a mesa empurra tudo
  para fora da tela).
- `.centro` → `min-height` reduzido (de 190px).
- `.controles` → já tem `flex-wrap`; garantir botões com alvo de toque confortável.

## Cartas e coringas (`@media` em `cards.css`)

| Elemento | Desktop | Tablet ≤900px | Celular ≤600px | Por quê |
|----------|---------|---------------|----------------|---------|
| `.carta` | 72×100px | ~62×86px | ~52×72px | 8 cartas × 52px com sobreposição cabem em 360px |
| `.mao .carta` margin-left | −16px | −14px | −12px | mantém o leque proporcional |
| `.carta .pip` fonte | 2.1rem | ~1.8rem | ~1.5rem | acompanha a carta menor |
| `.carta .canto` fonte | 0.85rem | ~0.75rem | ~0.65rem | idem |
| `.coringa`/`.consumivel`/`.voucher`/`.slot-vazio` | 96×124px | ~84×108px | ~72×94px | 5 coringas + consumíveis cabem na faixa do topo |
| `.coringa` fonte | 0.78rem | ~0.7rem | ~0.62rem | legibilidade no card menor |

**Sanidade da mão no celular:** 1ª carta 52px cheia + 7 × (52 − 12) = 52 + 280 =
**332px** < 360px. Cabe com folga.

A seleção de carta (`transform: translateY(-18px)`, hoje em `cards.css:39`)
funciona por toque sem mudança — o tap dispara o mesmo clique. Os 4 valores de
`translateY`/`scale` de estados (`.selecionada`, `.pontuando`, hover da mão)
permanecem proporcionais o suficiente; ajustar só se a inspeção visual indicar.

## Demais telas (`@media` em `screens.css`)

- `.blinds` (3 cartões de 250px lado a lado) → `flex-wrap: wrap`; no celular
  `.cartao-blind` com `width: 100%` (empilha os 3 verticalmente).
- `.itens-loja` → `flex-wrap: wrap`; itens encolhem e quebram em grade.
- `.cabecalho-run` (`gap: 1.5rem`) → `flex-wrap` + `gap`/fonte menores.
- `.logo` (2.6rem) → ~1.8rem no celular.
- Título / fim / seleção-blind / loja / pacote já são `flex column` centralizado;
  só precisam dos ajustes de wrap acima.

## Globais (`@media` em `base.css`)

- `#tooltip` (`max-width: 260px`) → reduzir e garantir que não saia da tela.
- `.painel-baralho` (overlay, `max-width: 600px`) → `width: 90vw` no celular.
- `.botao` → manter `padding` atual (0.6rem × 1.4rem já dá alvo de toque
  confortável); reduzir só `.botao-mini` se necessário.
- `#aviso` (toast) → garantir `max-width` para não estourar em telas estreitas.

## Não-objetivos (YAGNI)

- Não há reorganização de DOM via JS.
- Não há `clamp()`/unidades fluidas — só breakpoints.
- Não há gestos de toque novos (swipe, arrastar coringa por toque): o jogo já é
  baseado em clique/tap.
- Não há mudança no shape do `state` nem no save (`VERSAO_SAVE` permanece 4).
- Não há detecção de orientação por JS — `@media` de largura cobre retrato vs
  paisagem implicitamente.

## Testes

Mudança é puramente de CSS de apresentação, sem lógica nova — a suíte
(`node tests/todos.js`, baseline **112 testes, 0 falhas**) não muda e deve
continuar verde. Validação principal é por **inspeção visual em larguras de
viewport** (360px / 768px / 1280px), que segue pendente neste ambiente sem
browser (como as milestones anteriores). O spec documenta as larguras-alvo e a
conta de sanidade da mão para guiar essa verificação.

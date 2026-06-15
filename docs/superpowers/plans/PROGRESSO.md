# Estado da execução do plano — BalatroJs v1

Atualizado em: 2026-06-12
Plano: `docs/superpowers/plans/2026-06-12-balatro-v1.md` (16 tarefas, código completo em cada uma)
Branch: `main` (feature/v1 mergeada e apagada em 2026-06-12) | Workflow: superpowers:subagent-driven-development
(implementador haiku por tarefa → revisor spec+qualidade sonnet → fixes se necessário)

## Concluídas (implementadas + revisadas + aprovadas)

- [x] Task 1 — harness de testes (+fixes de review: erro?.message, clear() no shim)
- [x] Task 2 — RNG mulberry32 (+fixes: teste golden, igualdade de estado final)
- [x] Task 3 — baralho
- [x] Task 4 — mãos + detecção de pôquer
- [x] Task 5 — economia
- [x] Task 6 — chefes e blinds
- [x] Task 7 — planetas + 25 coringas
- [x] Task 8 — pipeline de pontuação (+polish: suprime efeito ×1 nulo; ?? no deck)
- [x] Task 9 — estado + save localStorage
- [x] Task 10 — loja (+fixes do review aplicados e commitados: guarda de índices, filter no load, import limpo)
- [x] Task 11 — orquestração da rodada (engine/run.js) — aprovada sem fixes
- [x] Task 12 — HTML + CSS (cópia canônica, aprovada sem fixes)
- [x] Task 13 — UI título + seleção de blind (cópia canônica, aprovada sem fixes)
- [x] Task 14 — UI rodada + animação (aprovada; import de run.js unificado em screens.js)
- [x] Task 15 — UI loja/pacote/fim (aprovada sem fixes)
- [x] Task 16 — README (idêntico ao plano) + smoke headless via engine em 3 seeds, sem crashes

Testes atuais: `node tests/todos.js` → **71 teste(s), 0 falha(s)**
(os totais previstos no plano valem +1 a partir da Task 3, por causa do teste golden extra do RNG)

- [x] Revisão final do conjunto (opus): READY TO MERGE, 0 issues bloqueantes; 3 minors anotados abaixo
- [x] Merge fast-forward em `main` (testes 71/0 no resultado), branch feature/v1 apagada

## Pendentes (ação do usuário)

- [ ] Deploy GitHub Pages: criar repo no GitHub, push da main, Settings→Pages → main/(root); depois trocar SEU-USUARIO no README
- [ ] Verificação visual no navegador (não há browser neste ambiente; roteiro no Step 2 da Task 16 do plano)

## Minors da revisão final — RESOLVIDOS (polimento, 2026-06-13)

Frente de polimento executada em `feature/polimento-v1` (plano
`docs/superpowers/plans/2026-06-12-polimento-v1.md`, spec
`docs/superpowers/specs/2026-06-12-polimento-v1-design.md`). Workflow
subagent-driven: implementador → revisor spec → revisor qualidade.

- [x] Minor 1 — fontes self-hostadas (Press Start 2P + Rubik variável, OFL) em `fonts/`,
  via `css/fonts.css`; removidos os links do Google Fonts. App roda offline sem
  dependência externa em runtime. (commit `5bd06e1`)
- [x] Minor 2 — `aoJogar` mostra toast "Blind vencida! +$N" após a animação, antes da
  loja. (commit `d977361`) — verificação **visual** no navegador ainda pendente (sem
  browser neste ambiente).
- [x] Minor 3 — `descricaoCoringa` corrigido: lógica extraída para `sufixoEstado(dados)`
  (função pura em `jokers.js`, testada), acumula todos os campos em vez de sobrescrever.
  (commit `3217d00`)

Testes após o polimento: `node tests/todos.js` → **72 teste(s), 0 falha(s)**.

## Layout preenchido — Etapa 2 — CONCLUÍDA (2026-06-15)

Frente executada em `feature/layout-etapa2` (plano
`docs/superpowers/plans/2026-06-15-layout-preenchido-etapa2.md`, spec
`docs/superpowers/specs/2026-06-15-layout-preenchido-etapa2-design.md`). Workflow
subagent-driven: implementador (haiku) → revisor spec (sonnet) → revisor qualidade
(sonnet) → revisão final da branch (opus). Merge `--no-ff` em `main`, branch apagada.

- [x] Task 1 — `versoBaralho(state)` no canto inferior direito da `.mesa`; botão
  "Baralho: N" removido dos controles (o verso assume o clique → `mostrarBaralho`).
  Fix da revisão: `total` usa `rodada.totalCartas` (capturado na criação da rodada em
  `run.js`, com fallback `??` p/ saves antigos) em vez de `mao+monte`, que encolhia.
- [x] Task 2 — estilo do verso: `.mesa` relativa; pilha de 3 versos com padrão
  diagonal dourado sobre `--vermelho-escuro`. Fix: pilha cresce p/ baixo-direita.
- [x] Task 3 — cartas maiores (88×122 desktop / 76×106 ≤900px / 60×84 ≤600px),
  overlap e `.pilha-verso` responsivos. Fix: overflow da mão a 360px (overlap base
  −20px em screens.css) e `.pilha-verso` a 900px. Cleanup: removido overlap morto de
  `cards.css` (media query não vencia a regra base de screens.css).

**Validação visual no navegador (chrome-devtools, ambiente COM browser):**
desktop 1280px — cartas 88×122, verso no canto com `44/52`, clique abre overlay,
sem botão "Baralho"; mobile 360px — `scrollWidth === clientWidth` (sem overflow),
verso 60×84. Screenshots conferidos.

Testes após a Etapa 2: `node tests/todos.js` → **112 teste(s), 0 falha(s)**.

## Iconografia de blinds e consumíveis — CONCLUÍDA (2026-06-15)

Frente executada em `feature/iconografia` (plano
`docs/superpowers/plans/2026-06-15-iconografia-blinds-consumiveis.md`, spec
`docs/superpowers/specs/2026-06-15-iconografia-blinds-consumiveis-design.md`).
Workflow subagent-driven (implementador haiku → spec sonnet → qualidade sonnet →
final opus). Merge `--no-ff` em `main`, branch apagada, push.

- [x] Task 1 (TDD) — campo `icone` (glifo Unicode) em 9 planetas, 6 tarôs, 3
  espectrais (`js/data/*.js`); teste em `data.test.js` garante glifo não-vazio
  (`.trim().length > 0`). Suíte 112 → 113.
- [x] Task 2 — glifo central na caixa do consumível (`elementoConsumivel`); CSS
  layout coluna (espelha o coringa) + cor por tipo. Fix: glifo escala nos
  breakpoints (2.6 / 2.1 / 1.6rem) para não vazar a 56×74 no mobile.
- [x] Task 3 — `ICONE_BLIND = { pequena:"●", grande:"◆", chefe:"☠" }` antes do nome
  na seleção (`cartaoBlind`) e na lateral (`painelLateral`); CSS `.icone-blind`;
  chefe herda vermelho do `<h3>`.

Glifos: planetas ♇☿♅♀♄♃⊕♂♆ · tarôs ✷★☾⛧☸⚖ · espectrais ✦❂☄ · blinds ●◆☠.

**Validação visual no navegador (chrome-devtools):** teste de fingerprint de pixels
confirmou os 21 glifos renderizando sem tofu (□) na fonte Rubik; cores por tipo
corretas; ⊕ (pior caso) cabe na caixa 56×74 mobile com folga; blinds na seleção e na
lateral; chefe em vermelho.

Testes após a iconografia: `node tests/todos.js` → **113 teste(s), 0 falha(s)**.

## Convenções (não esquecer nos prompts dos subagentes)

- Código/comentários em português; zero dependências; ES modules sem build.
- Todo commit com segunda linha: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- O texto completo de cada task (com todo o código) está no arquivo do plano — copiar a seção "### Task N" no prompt do implementador.
- Revisor: spec primeiro, qualidade depois; aplicar fixes Important; minors viram batch de polimento.

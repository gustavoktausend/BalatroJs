# Baralhos e Stakes — BalatroJS

Data: 2026-06-14
Milestone: #4 do roadmap.

## Objetivo

Permitir escolher, no início da run, um **baralho** (modifica recursos iniciais) e um
**stake** (nível de dificuldade que escala alvos/economia). Ambos são dados passivos
consultados nos pontos de integração; nenhum modifica as cartas do baralho (sem baralho
persistente, herdado da #2).

## Escopo

- 4 baralhos: Padrão (neutro), Vermelho (+1 descarte/rodada), Azul (+1 mão/rodada),
  Amarelo (+$10 inicial).
- 3 stakes progressivos: Branco (base), Vermelho (alvos +25%), Dourado (alvos +25% e −$1
  inicial).
- Seleção na tela de título (antes de "Jogar"); baralho/stake fixos durante a run.
- `state.baralho` e `state.stake` (ids); `dinheiro` inicial calculado a partir deles.

## Não-escopo

- Modificar cartas do baralho (transformar/remover) — sem baralho persistente.
- Desbloqueio progressivo de stakes (todos disponíveis desde já).
- Mais de 4 baralhos / 3 stakes nesta entrega.
- Migração de saves: `VERSAO_SAVE` 3→4; saves v3 **descartados** ao carregar (comportamento
  atual). Sem código de migração.

## Modelo de dados

- `criarRun(semente, baralhoId = "padrao", stakeId = "branco")` — dois novos parâmetros.
  Defaults preservam a run normal (nenhuma regressão).
- `state.baralho = baralhoId`, `state.stake = stakeId`.
- `dinheiro` inicial calculado:
  `Math.max(0, 4 + BARALHOS[baralhoId].dinheiroInicial + STAKES[stakeId].dinheiroInicial)`.
- `VERSAO_SAVE` 2→... atual é 3; passa a **4**. `carregar()` já descarta versão divergente.
  `state.baralho`/`state.stake` são strings (JSON puro), persistidas sem mudança.
- Fallback defensivo: `BARALHOS[id] || BARALHOS.padrao` e `STAKES[id] || STAKES.branco` ao
  consultar, caso um id inválido chegue.

### `js/data/baralhos.js`

`{ id, nome, descricao, dinheiroInicial, maosBonus, descartesBonus }`. Padrão = todos 0.

- `padrao`   — "Baralho Padrão" — "Sem modificadores." — 0/0/0
- `vermelho` — "Baralho Vermelho" — "+1 descarte por rodada." — dinheiro 0, mãos 0, descartes 1
- `azul`     — "Baralho Azul" — "+1 mão por rodada." — dinheiro 0, mãos 1, descartes 0
- `amarelo`  — "Baralho Amarelo" — "Começa com +$10." — dinheiro 10, mãos 0, descartes 0

Exportar `BARALHOS` (objeto por id).

### `js/data/stakes.js`

`{ id, nome, descricao, multAlvo, dinheiroInicial }`.

- `branco`  — "Stake Branco" — "Dificuldade normal." — multAlvo 1, dinheiroInicial 0
- `vermelho`— "Stake Vermelho" — "Alvos das blinds +25%." — multAlvo 1.25, dinheiroInicial 0
- `dourado` — "Stake Dourado" — "Alvos +25% e começa com $1 a menos." — multAlvo 1.25,
  dinheiroInicial −1

Exportar `STAKES` (objeto por id).

## Pontos de integração

1. **Dinheiro inicial** — em `criarRun` (fórmula acima, piso 0). Toca `state.js`.
2. **Vermelho (+1 descarte)** — `iniciarBlind` (`js/engine/run.js`):
   `descartesRestantes: DESCARTES_POR_BLIND + (BARALHOS[state.baralho] || BARALHOS.padrao).descartesBonus`.
3. **Azul (+1 mão)** — `iniciarBlind`, somando ao termo do voucher Mãos+ existente:
   `maosRestantes: MAOS_POR_BLIND + (state.vouchers.includes("maos-mais") ? 1 : 0) +
   (BARALHOS[state.baralho] || BARALHOS.padrao).maosBonus`.
4. **Stake → alvos** — `alvoDaBlind(ante, tipo, chefeId, multStake = 1)` em
   `js/engine/blinds.js`: cada retorno multiplicado por `multStake` com `Math.floor`.
   Default 1 preserva `tests/blinds.test.js`. Chamadores passam
   `(STAKES[state.stake] || STAKES.branco).multAlvo`:
   - `iniciarBlind` (run.js) ao definir `state.blindAtual.alvo`;
   - `screens.js` onde mostra o alvo na seleção de blind.
5. **Dourado (economia)** — limitado ao −$1 inicial (item 1) + alvos +25% (item 4). NÃO
   mexe em juros (evita conflito com o voucher Juros+).

## UI

### Tela de título (`renderTitulo` em `screens.js`)
- Dois `<select>` — "Baralho" e "Stake" — entre o campo de seed e o botão "Jogar".
  Opções = ids com `nome`; default `padrao`/`branco`.
- Um texto curto sob cada seletor mostrando a `descricao` da opção selecionada; atualiza
  no `change`.
- "Jogar" (`iniciarJogo`) lê os dois seletores + seed e chama
  `criarRun(semente, baralhoId, stakeId)`.

### Durante a run (`cabecalhoRun` em `render.js`)
- Mostrar de forma compacta o baralho e stake atuais (ex.: um `span.descricao` com
  `${BARALHOS[state.baralho].nome} · ${STAKES[state.stake].nome}`), junto dos demais
  campos do cabeçalho.

### CSS (`css/screens.css`)
- Estilo dos `<select>` e do texto de descrição, coerente com `.campo-seed`.

## Tratamento de erros

- ids inválidos não ocorrem (vêm dos seletores), mas o fallback
  `BARALHOS[id] || BARALHOS.padrao` / `STAKES[id] || STAKES.branco` evita crash.
- `criarRun` com dinheiro calculado nunca fica negativo (piso 0).
- Saves v3 descartados (sem `baralho`/`stake`), então nenhum acesso a campo ausente.

## Testes (`tests/baralhos-stakes.test.js`, novo, importado em `tests/todos.js`)

- Dados: 4 baralhos + 3 stakes com os campos esperados; `padrao`/`branco` neutros (0 / mult 1).
- `criarRun`: Amarelo → `dinheiro === 14`; Dourado → `3`; Padrão/Branco → `4`;
  Amarelo+Dourado empilha → `13`; piso 0 nunca negativo.
- `criarRun` default: `state.baralho === "padrao"`, `state.stake === "branco"`.
- `iniciarBlind`: Vermelho → `descartesRestantes === DESCARTES_POR_BLIND + 1`; Azul →
  `maosRestantes === MAOS_POR_BLIND + 1`; Azul + voucher Mãos+ → `MAOS_POR_BLIND + 2`.
- `alvoDaBlind`: `multStake` default 1 = valor atual (ex.: pequena ante 1 = 300); `1.25` →
  `Math.floor(300 * 1.25) === 375`.
- `iniciarBlind` com stake Vermelho → `state.blindAtual.alvo` reflete o ×1.25.
- Determinismo: `criarRun(seed, baralho, stake)` reproduz a mesma run (mesmos chefes).

## Critérios de sucesso

1. O jogador escolhe baralho e stake no título; "Jogar" cria a run com eles; ambos
   aparecem no cabeçalho durante a run.
2. Cada efeito funciona: Vermelho +1 descarte, Azul +1 mão, Amarelo +$10, stakes escalam
   os alvos em +25% e Dourado começa com $1 a menos.
3. Run normal (Padrão/Branco) é idêntica ao comportamento atual (sem regressão); testes
   existentes de `blinds.test.js` seguem verdes.
4. `node tests/todos.js` passa, com os novos testes (total > 103, 0 falhas).
5. `VERSAO_SAVE === 4`; saves v3 descartados sem quebrar a página.

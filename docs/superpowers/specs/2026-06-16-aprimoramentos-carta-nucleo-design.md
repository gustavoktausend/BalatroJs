# Aprimoramentos de carta — Sub-etapa A (núcleo): shape + pontuação

**Data:** 2026-06-16
**Branch alvo:** `main` (deploy via GitHub Pages)
**Projeto pai:** Aprimoramentos de carta (P1 da auditoria de paridade), decomposto em:
- **A — Núcleo (este spec):** campo `aprimoramento` na carta, baralho-mestre da run,
  efeitos no pipeline de pontuação e na detecção de mão, destruição de carta de vidro.
- **B — Fontes (futuro):** tarôs que aplicam aprimoramentos com seleção interativa de
  cartas + pacote Padrão de cartas.
- **C — Visual (futuro):** cor de fundo/badge/brilho por aprimoramento, tooltips,
  animação de `carta-destruida`.

> Cada sub-etapa é seu próprio ciclo brainstorm → spec → plano → implementação.

---

## 1. Objetivo

Introduzir o sistema de **aprimoramentos de carta** do Balatro: cada carta do baralho
pode ter no máximo um aprimoramento que altera pontuação e/ou detecção de mão. Esta
sub-etapa entrega os **8 aprimoramentos** funcionando no engine, validados por testes
e por uma "prova viva" (um tarô real que aplica aprimoramento), sem ainda o trabalho
visual nem o conjunto completo de fontes.

Os 8 aprimoramentos:

| Aprimoramento | id | Efeito |
|---|---|---|
| Bônus | `bonus` | +30 chips ao pontuar |
| Mult | `mult` | +4 mult ao pontuar |
| Selvagem | `wild` | conta como qualquer naipe (flush/seq-de-naipe); rank inalterado |
| Vidro | `vidro` | ×2 mult ao pontuar; 1/4 de chance de se destruir (remove do baralho da run) |
| Aço | `aco` | ×1.5 mult enquanto está **na mão** (mesmo sem ser jogada) |
| Ouro | `ouro` | +$3 se estiver na mão no **fim da rodada** |
| Pedra | `pedra` | +50 chips; **sempre** pontua; sem rank/naipe para formar mãos |
| Sorte | `sorte` | 1/5 de chance de +20 mult; 1/15 de chance de +$20 (ao pontuar) |

Aprimoramentos são **ortogonais** a edições (foil/holo/poly/negative) e selos —
projetos próprios futuros. Campo distinto na carta.

---

## 2. Decisões tomadas no brainstorm

- **Todos os 8 no núcleo**, incluindo wild e pedra (que mexem em `poker.js`).
- **Prova viva:** adiantar **um** tarô real ("O Mago" → aplica Mult) já nesta sub-etapa,
  para validar o caminho ponta-a-ponta. As demais fontes ficam na Sub-etapa B.
- **Vidro destrói a carta permanentemente do baralho da run** (fiel ao Balatro), não só
  da mão da rodada.
- **Arquitetura:** introduzir um **baralho-mestre da run** persistente (`state.baralhoRun`)
  do qual cada blind tira uma cópia embaralhada. É o que permite aprimoramentos
  persistirem entre blinds e vidro destruir de verdade.
- **Save:** bump `VERSAO_SAVE 4 → 5`. **Sem migração** — não há run em andamento; saves de
  versão diferente já são descartados por `carregar()` (comportamento atual). 
- **RNG:** vidro e sorte consomem `entre(state,...)` durante a pontuação. Já há
  precedente (Coringa Misterioso); manter o comentário de ordem/determinismo.

---

## 3. Arquitetura

### 3.1 Shape da carta (`deck.js`)

`criarBaralho()` passa a produzir cartas `{ id, naipe, valor, aprimoramento: null }`.
`aprimoramento` é sempre presente; `null` = sem aprimoramento. Demais funções de
`deck.js` (`chipsDaCarta`, `rotuloDaCarta`, `ehFigura`) inalteradas.

### 3.2 Dados dos aprimoramentos (`js/data/aprimoramentos.js`, novo)

Segue o padrão de `jokers.js`/`taros.js`: um objeto por id com `nome` (PT-BR),
`descricao` (PT-BR) e os metadados de efeito que `scoring.js`/`poker.js` consultam.
Mantém a mecânica fora do engine e dá um ponto único para o teste de dados anti-vácuo
(no estilo do teste de `icone`).

### 3.3 Baralho-mestre da run (`state.js`, `run.js`)

- `criarRun()` cria `state.baralhoRun` = 52 cartas com `aprimoramento` (via `criarBaralho()`).
- `iniciarBlind` (`run.js:27`) troca `embaralhar(state, criarBaralho())` por
  `embaralhar(state, copiarBaralho(state.baralhoRun))`, onde `copiarBaralho` faz cópia
  rasa por carta (a rodada não deve mutar o mestre, exceto destruição de vidro, que é
  feita explicitamente no mestre — ver 3.6).
- `salvar` (`state.js`) inclui `baralhoRun`. `VERSAO_SAVE → 5`. Sem migração.

### 3.4 Pipeline de pontuação (`scoring.js`)

`pontuarJogada` passa a enxergar a **mão atual** (`state.rodada.mao`), não só as cartas
jogadas (necessário para aço). Ordem fiel ao Balatro:

1. Para cada carta em `jogada.cartasQuePontuam`:
   - chips base da carta (`chipsDaCarta`) — **exceto pedra**, que não soma chips por rank;
   - **efeito do aprimoramento da carta pontuada** (`aplicar(...)`, reusa a função
     existente → já emite evento para animação), com origem `"aprimoramento:<id>"`:
     - `bonus` → `{ chips: 30 }`
     - `mult` → `{ mult: 4 }`
     - `pedra` → `{ chips: 50 }`
     - `vidro` → `{ xmult: 2 }`, depois rola `entre(state,1,4)===1`; se quebrar, marca a
       carta para destruição (não muta o baralho aqui — ver 3.6);
     - `sorte` → rola `entre(state,1,5)===1` → `{ mult: 20 }`; rola `entre(state,1,15)===1`
       → acumula +$20 (creditado ao fim da pontuação);
   - **depois** os coringas reagem (`aoPontuarCarta`) — aprimoramento vem **antes**.
2. Após o loop por carta: **aço** — varre `state.rodada.mao` inteira (8 cartas, não só as
   jogadas) e aplica `{ xmult: 1.5 }` por carta de aço.
3. Coringas `aoPontuarMao` (inalterado).
4. Total. Eventos de `carta-destruida` (vidro) e o dinheiro de sorte são devolvidos no
   resultado para `run.js` aplicar (pontuação fica sem efeito colateral no estado).

`ouro` **não** entra na pontuação — é fim de rodada (3.6).

### 3.5 Detecção de mão (`poker.js`): wild e pedra

- **Wild:** afeta só naipe. Flush passa a ser "existe um naipe tal que toda carta é
  desse naipe **ou** é wild". Wild **não** muda rank (grupos/sequência por valor
  inalterados). Valor e chips do wild são os normais.
- **Pedra:** removida da detecção por rank **e** naipe (filtrada antes de detectar a mão
  com as restantes), mas **sempre anexada** a `cartasQuePontuam`. Caso-limite: jogada
  só de pedras → detecta `carta-alta` sem carta de rank, com as pedras anexadas (pontuam
  os +50 cada sobre a base de carta-alta).
- **Regressão:** com `aprimoramento: null` (sem wild/pedra), `detectarMao` se comporta
  **identicamente** ao atual. Os 113 testes existentes devem permanecer verdes.

### 3.6 Destruição de carta de vidro + ouro (`run.js`)

- `scoring.js` emite `{ tipo: "carta-destruida", carta }` e devolve a lista de cartas a
  destruir. Em `run.js → jogar`, após pontuar, remove essas cartas do **`state.baralhoRun`**
  por `id`. Efeito visível: a carta não retorna nas próximas rodadas. O evento já fica
  pronto para a animação da Sub-etapa C (UI atual pode ignorá-lo sem quebrar).
- **Ouro:** em `vencerBlind`, junto do loop `aoFimDaRodada` dos coringas, `+$3` por carta
  de ouro presente em `state.rodada.mao` no momento da vitória; soma a `dinheiroExtra`.
- O dinheiro acumulado de **sorte** (durante a pontuação) é creditado em `jogar` após
  somar a pontuação.

### 3.7 Prova viva: "O Mago" (`data/taros.js`)

Novo tarô seguindo o shape atual (`{ id, nome, icone, descricao, aplicar(state) }`).
Efeito: aplica **Mult** a até 2 cartas. Como a UI de seleção de cartas por tarô é da
Sub-etapa B, nesta sub-etapa "O Mago" aplica às 2 primeiras cartas da **mão atual** se
houver rodada ativa, senão às 2 primeiras do `baralhoRun`, e marca no `baralhoRun`
(persiste). Comentário explícito de que a seleção interativa vem na Sub-etapa B.

Dá o caminho ponta-a-ponta: comprar O Mago → aplicar → ver a carta dar +4 mult ao pontuar.

---

## 4. Testes (harness próprio, sem framework — `teste/ok/igual`)

- **Dados** (`data.test.js` ou novo): cada aprimoramento tem `nome`/`descricao`
  não-vazios (anti-vácuo, estilo teste de `icone`).
- **Pontuação** (`scoring.test.js`):
  - bônus (+30 chips), mult (+4 mult), pedra (+50 chips e sempre pontua, inclusive
    jogada só-de-pedra), aço (×1.5 estando na mão sem ser jogada), vidro (×2 mult).
  - RNG determinístico: com semente fixa, vidro quebra/sobrevive de forma reproduzível;
    sorte concede/nega mult e $ de forma reproduzível.
- **Detecção** (`poker.test.js`): wild fecha flush; wild não muda rank; pedra fora da
  detecção por rank/naipe; jogada só-de-pedras.
- **Run** (`run.test.js`): vidro destrói do `baralhoRun` (carta some das rodadas
  seguintes); ouro dá $3 no fim da rodada; "O Mago" aplica Mult e persiste no `baralhoRun`.
- **Regressão:** `node tests/todos.js` — os 113 testes atuais continuam verdes.

---

## 5. Arquivos tocados

- `js/engine/deck.js` — shape da carta + `copiarBaralho` (ou helper de cópia).
- `js/state.js` — `baralhoRun` em `criarRun`/`salvar`; `VERSAO_SAVE → 5`.
- `js/engine/run.js` — baralho da rodada a partir do mestre; destruição de vidro; ouro.
- `js/engine/scoring.js` — efeitos de aprimoramento por carta + aço; mão visível; retorno
  de cartas-destruidas e $ de sorte.
- `js/engine/poker.js` — wild (naipe) e pedra (fora da detecção, sempre pontua).
- `js/data/aprimoramentos.js` — **novo**, definições dos 8.
- `js/data/taros.js` — "O Mago".
- `tests/*.test.js` — novos testes acima.

---

## 6. Fora de escopo (sub-etapas futuras)

- Visual das cartas aprimoradas (cor/badge/brilho), tooltips, animação de destruição → **C**.
- Seleção interativa de cartas por tarô; demais tarôs/espectrais que aplicam
  aprimoramento; pacote Padrão de cartas → **B**.
- Edições e selos → projetos próprios (P1/P2).

---

## 7. Notas de fidelidade / risco

- A **ordem** dos efeitos (chips base → aprimoramento da carta → coringas → aço → mão)
  importa para paridade; documentar em comentário no `scoring.js`.
- `detectarMao` deve preservar comportamento idêntico para cartas sem aprimoramento
  (proteger os 113 testes). Maior risco da sub-etapa é em `poker.js` (pedra).
- Determinismo: vidro/sorte rolam RNG na pontuação; a ordem das cartas que pontuam afeta
  o fluxo de RNG da mão — mesmo padrão e comentário já usados no Coringa Misterioso.

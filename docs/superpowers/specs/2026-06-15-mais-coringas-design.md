# Design — Mais coringas (lote +25, de 25 para 50)

**Data:** 2026-06-15
**Item do backlog:** 🎯 (P1) Mais coringas — `docs/superpowers/plans/2026-06-15-auditoria-paridade-balatro.md`
**Branch alvo:** feature própria a partir de `main` (merge `--no-ff` + push, como de praxe)

## 1. Objetivo e escopo

Subir o conteúdo de coringas de **25 para 50**, adicionando 25 coringas novos
adaptados do Balatro original para PT-BR. Decisões fechadas no brainstorm:

- **Mecânica:** apenas ganchos e efeitos que o motor JÁ suporta. **Zero mudança no
  engine** (`scoring.js`, `run.js`, `shop.js` ficam intactos).
- **Quantidade:** +25 (14 comuns / 8 incomuns / 3 raros), espelhando a proporção
  atual (14/8/3). Total final: **28 comuns / 16 incomuns / 6 raros = 50**.
- **Identidade:** adaptados de coringas reais do Balatro; nome e descrição em PT-BR.
- **Abordagem:** cobertura por eixo de gancho (variedade deliberada: valor de carta,
  naipe, figura, tipo de mão, contagem/condição de rodada, ×mult escalável, economia).

**Fora de escopo:** novos ganchos, novos efeitos, aprimoramentos/edições/selos,
mexer na loja ou na ordem de pontuação. Coringas cujo efeito fiel ao Balatro exigiria
esses sistemas foram adaptados para caber no motor atual (ver §5).

## 2. O que o motor já oferece (restrição de design)

Confirmado lendo `scoring.js`, `run.js`, `shop.js`, `deck.js`, `rng.js`:

**Ganchos disponíveis** (cada coringa é `{ id, nome, raridade, preco, descricao,
estadoInicial?, ganchos: {...} }`):
- `aoPontuarCarta(carta, ctx)` → `{ chips?, mult?, xmult? }` — por carta que pontua.
- `aoPontuarMao(ctx)` → `{ chips?, mult?, xmult? }` — uma vez por jogada.
- `aoFimDaRodada(ctx)` → `{ dinheiro?, destruir? }` — `ctx.blindTipo` disponível.
- `aoDescartar(ctx)`, `aoUsarPlaneta(ctx)`, `aoComprarCoringa(ctx)` — efeitos
  colaterais no estado (sem retorno pontuável).

**Efeitos somados pelo pipeline** (`aplicar` em `scoring.js`): `chips`, `mult`,
`xmult` (multiplicativo; ×1 é suprimido como nulo), `dinheiro`, `destruir`.

**ctx exposto:**
- `ctx.jogada`: `.tipo` (id da mão), `.cartas` (jogadas), `.cartasQuePontuam`.
- `ctx.state`: `.dinheiro`, `.ante`, `.coringas`, `.consumiveis`,
  `.estatisticas.porMao`, `.ultimaMaoJogada`,
  `.rodada.{ maosRestantes, descartesRestantes, descartesUsados, tiposJogados,
  mao, baralho, totalCartas }`.
- `ctx.coringa.dados`: estado interno serializado (de `estadoInicial`).
- `ctx.memoria`: objeto efêmero compartilhado entre ganchos **na mesma jogada**.

**Ordem temporal relevante** (de `run.js`): em `aoPontuarMao`, a jogada ainda NÃO
foi removida da mão e `maosRestantes` ainda NÃO foi decrementado. Logo "última mão da
rodada" ⇔ `state.rodada.maosRestantes === 1` no momento da pontuação.

**Helpers:** `ehFigura(carta)`, `chipsDaCarta(carta)`, `maoContem(tipoJogado, alvo)`
(de `hands.js`; cai em igualdade exata para alvos sem tabela, ex. `"flush"`),
`entre(state, min, max)` (inteiro inclusivo, consome o RNG da run — usar para
aleatoriedade, como Gros Michel/Cavendish já fazem).

**Modelo da carta:** `{ id, naipe, valor }`, `valor` 2–14 (A=14, J=11, Q=12, K=13).
Par/ímpar e Ás são derivados de `carta.valor`.

## 3. Lista dos 25 coringas novos

Convenções: `id` em kebab-case; raridade `comum|incomum|raro`; preço no padrão das
faixas existentes (comum 3–5, incomum 6–7, raro 8–9). Helper local sugerido:
`function porCarta(predicado, efeito)` análogo ao `maisTresPorNaipe`/`seContem` já no
arquivo, para os efeitos por-carta.

### 3.1 Comuns (14) — preço 3–5

| id | Nome | Efeito | Gancho |
|---|---|---|---|
| `steven-par` | Steven Par | +4 mult por carta de valor PAR (2,4,6,8,10) pontuada | `aoPontuarCarta` |
| `todd-impar` | Todd Ímpar | +31 chips por carta de valor ÍMPAR (A,3,5,7,9) pontuada | `aoPontuarCarta` |
| `cara-assustadora` | Cara Assustadora | +30 chips por figura (J/Q/K) pontuada | `aoPontuarCarta` |
| `cara-sorridente` | Cara Sorridente | +5 mult por figura pontuada | `aoPontuarCarta` |
| `erudito` | Erudito | Cada Ás pontuado dá +20 chips e +4 mult | `aoPontuarCarta` |
| `walkie-talkie` | Walkie Talkie | Cada 10 ou 4 pontuado dá +10 chips e +4 mult | `aoPontuarCarta` |
| `coringa-alegre` | Coringa Alegre | +8 mult se a mão contém um Par | `aoPontuarMao` |
| `coringa-astuto` | Coringa Astuto | +50 chips se a mão contém um Par | `aoPontuarMao` |
| `coringa-travesso` | Coringa Travesso | +12 mult se a mão contém uma Trinca | `aoPontuarMao` |
| `coringa-diabrete` | Coringa Diabrete | +10 mult se a mão jogada é Naipe (Flush) | `aoPontuarMao` |
| `coringa-malandro` | Coringa Malandro | +80 chips se a mão jogada é Naipe (Flush) | `aoPontuarMao` |
| `coringa-devoto` | Coringa Devoto | +100 chips se a mão jogada é Sequência | `aoPontuarMao` |
| `arena` | Arena | +2 chips por cada $1 que você possui | `aoPontuarMao` |
| `acrobata` | Acrobata | ×3 mult na última mão da rodada (`maosRestantes === 1`) | `aoPontuarMao` |

Notas de implementação (comuns):
- `steven-par`/`todd-impar`: paridade por `carta.valor % 2`. Atenção: A=14 é PAR pela
  aritmética, mas no Balatro o Ás conta como ÍMPAR e o 10 como PAR. Tratar A como
  ímpar explicitamente (`valor === 14 → ímpar`). Documentar no comentário.
- `coringa-diabrete`/`coringa-malandro`: condição `ctx.jogada.tipo === "flush"`
  (mão é exatamente Flush). Usar `maoContem(ctx.jogada.tipo, "flush")` para
  consistência de estilo (igualdade exata).
- `coringa-devoto`: `maoContem(ctx.jogada.tipo, "sequencia")` (inclui sequência de
  naipe, como o `maluco` já faz).
- `arena`: `{ chips: 2 * ctx.state.dinheiro }`.
- `acrobata`: `ctx.state.rodada.maosRestantes === 1 ? { xmult: 3 } : null`.

### 3.2 Incomuns (8) — preço 6–7

| id | Nome | Efeito | Gancho(s) |
|---|---|---|---|
| `estencil` | Estêncil | ×mult = nº de slots de coringa VAZIOS + 1 | `aoPontuarMao` |
| `abstrato` | Coringa Abstrato | +3 mult por Coringa que você possui | `aoPontuarMao` |
| `fibonacci` | Fibonacci | +8 mult por carta A/2/3/5/8 pontuada | `aoPontuarCarta` |
| `cartao-fidelidade` | Cartão Fidelidade | ×4 mult a cada 6 mãos jogadas (na 6ª, 12ª, …) | `aoPontuarMao` + estado |
| `bode` | Bode Expiatório | +1 mult acumulado por mão SEM figura jogada; zera ao jogar figura | `aoPontuarMao` + estado |
| `corrida` | Corrida | +15 chips acumulados a cada Sequência jogada | `aoPontuarMao` + estado |
| `castelo-cartas` | Castelo de Cartas | +4 chips acumulados sempre que a jogada tem exatamente 4 cartas | `aoPontuarMao` + estado |
| `misterioso` | Coringa Misterioso | +mult aleatório de 0 a 23 a cada mão | `aoPontuarMao` |

Notas de implementação (incomuns):
- `estencil`: `{ xmult: (MAX_CORINGAS - ctx.state.coringas.length) + 1 }`. Como o
  próprio Estêncil ocupa um slot, com 5/5 ocupados → ×1 (suprimido). Importar
  `MAX_CORINGAS` de `shop.js` **ou** definir a constante 5 localmente para não criar
  dependência circular `jokers.js → shop.js`. **Decisão: usar literal 5 com
  comentário** (jokers.js não deve importar shop.js).
- `abstrato`: `{ mult: 3 * ctx.state.coringas.length }` (conta a si mesmo, fiel ao
  Balatro).
- `fibonacci`: `[14,2,3,5,8].includes(carta.valor)` → `{ mult: 8 }`.
- `cartao-fidelidade`: `estadoInicial: { contagem: 0 }`. A cada `aoPontuarMao`:
  `dados.contagem++`; se `dados.contagem % 6 === 0` → `{ xmult: 4 }`.
- `bode`: `estadoInicial: { mult: 0 }`. Em `aoPontuarMao`: se a jogada contém alguma
  figura (`ctx.jogada.cartas.some(ehFigura)`) → `dados.mult = 0` e retorna nulo;
  senão `dados.mult += 1` e retorna `{ mult: dados.mult }`.
- `corrida`: `estadoInicial: { chips: 0 }`. Em `aoPontuarMao`: se a mão é Sequência
  (`maoContem(tipo, "sequencia")`) `dados.chips += 15`. Retorna `{ chips: dados.chips }`
  sempre (acumulado persiste). (Modelo do Runner do Balatro.)
- `castelo-cartas`: `estadoInicial: { chips: 0 }`. Em `aoPontuarMao`: se
  `ctx.jogada.cartas.length === 4` → `dados.chips += 4`. Retorna `{ chips: dados.chips }`.
- `misterioso`: `{ mult: entre(ctx.state, 0, 23) }` (consome o RNG da run).

### 3.3 Raros (3) — preço 8–9

| id | Nome | Efeito | Gancho(s) |
|---|---|---|---|
| `coturno` | Coturno | +2 mult por cada $5 que você possui | `aoPontuarMao` |
| `coringa-ouro` | Coringa de Ouro | Dá $4 ao fim de cada rodada | `aoFimDaRodada` |
| `campeao` | Campeão | ×mult acumulado: começa ×1, +0,1 a cada Quadra jogada | `aoPontuarMao` + estado |

Notas de implementação (raros):
- `coturno`: `{ mult: 2 * Math.floor(ctx.state.dinheiro / 5) }` (Bootstraps, sem teto).
- `coringa-ouro`: `aoFimDaRodada: () => ({ dinheiro: 4 })`.
- `campeao`: `estadoInicial: { x: 1 }`. Em `aoPontuarMao`: se a mão é Quadra
  (`ctx.jogada.tipo === "quadra"`) `dados.x = +(dados.x + 0.1).toFixed(1)`. Retorna
  `{ xmult: dados.x }` sempre. (Adaptação de ×mult escalável; usa `sufixoEstado` com
  o campo `x`, que já é exibido no tooltip.)

## 4. Tooltips e estado interno

Os coringas com `estadoInicial` (`cartao-fidelidade`, `bode`, `corrida`,
`castelo-cartas`, `campeao`) usam o `sufixoEstado(dados)` já existente, que formata
`mult` (`+N`), `x` (`×N`) e `valor` (`$N`). Para os campos novos:
- `bode` usa `dados.mult` → já formatado por `sufixoEstado`. ✅
- `campeao` usa `dados.x` → já formatado. ✅
- `corrida`/`castelo-cartas` usam `dados.chips`, e `cartao-fidelidade` usa
  `dados.contagem` — **não** formatados por `sufixoEstado` hoje. Para não inflar o
  escopo, esses NÃO terão sufixo no tooltip (a descrição já explica). Alternativa
  (opcional, fora do escopo): estender `sufixoEstado` para `chips`. **Decisão: não
  estender agora**; manter `sufixoEstado` intacto.

## 5. Fidelidade — adaptações conscientes

Coringas do Balatro cujo efeito fiel exigiria sistemas de P1 (aprimoramentos,
edições, retrigger) foram adaptados:
- **Coringa de Ouro** (`coringa-ouro`): no Balatro dá $4 no fim da rodada — portado
  1:1 (cabe em `aoFimDaRodada`).
- **Campeão** (`campeao`): o Champion do Balatro é ×mult que cresce com cartas
  jogadas com certas condições; adaptado para ×mult escalável por Quadra (cabe em
  estado + `xmult`).
- **Cartão Fidelidade** (`cartao-fidelidade`): no Balatro é ×4 a cada 6ª mão (×1 nas
  outras) — portado fielmente com contador.

Nenhum coringa novo depende de aprimoramento/edição/selo/retrigger.

## 6. Testes

Harness próprio (`tests/harness.js` → `teste/ok/igual`), sem framework. Padrão:
dados em `data.test.js`, pontuação em `scoring.test.js`.

**6.1 Dados (`tests/data.test.js`):**
- Atualizar o teste existente `"jokers: 25 coringas — 14 comuns, 8 incomuns, 3 raros"`
  para **50 coringas — 28 comuns, 16 incomuns, 6 raros**. As asserções de integridade
  (id/nome/descricao não vazios, ≥1 gancho, preço > 0) já varrem `Object.values` e
  passam a cobrir os novos automaticamente.
- Garantir ids únicos (Set size === lista length) — adicionar se não existir.

**6.2 Pontuação (`tests/scoring.test.js`):** um teste por mecânica nova não-trivial,
no estilo dos existentes (`stateBase({ coringas: [novoCoringa("...")] })` + asserção
no `total` ou nos `eventos`). Cobertura mínima:
- por-carta com condição: `steven-par` (par soma, ímpar/A não), `todd-impar` (A conta
  como ímpar), `fibonacci`, `erudito`, `cara-assustadora`/`cara-sorridente`,
  `walkie-talkie`.
- por-mão condicional: `coringa-alegre`/`astuto` (par), `coringa-diabrete`/`malandro`
  (flush sim / não-flush não), `acrobata` (`maosRestantes` 1 vs 2).
- dependentes de estado do state: `arena`/`coturno` (variar `dinheiro`),
  `estencil` (variar nº de coringas), `abstrato`.
- estado interno acumulado: `cartao-fidelidade` (6 mãos → ×4 na 6ª), `bode` (acumula,
  zera com figura), `corrida`, `castelo-cartas`, `campeao` (×1 → ×1.1 após Quadra).
- `coringa-ouro`: teste em `run.test.js` no estilo do `foguete` (dinheiro ao fim da
  rodada) — verificar `aoFimDaRodada` somar $4.
- `misterioso`: testar com `state` de seed fixa que o retorno está no intervalo
  [0,23] (ou apenas que produz `mult` ≥ 0 e ≤ 23 em N amostras), sem golden frágil.

Meta: suíte sai de **113** para ~**113 + (1 ajuste) + ~18 novos** (estimativa; o
número exato sai no plano). Todos verdes antes de mergear.

## 7. Arquivos tocados

- `js/data/jokers.js` — adicionar 25 entradas a `LISTA` (mais helper(s) local(is) se
  ajudar a legibilidade). **Único arquivo de produção alterado.**
- `tests/data.test.js` — atualizar contagem 25→50 e proporção.
- `tests/scoring.test.js` — novos testes de pontuação.
- `tests/run.test.js` — teste de `coringa-ouro` (fim de rodada).

Não tocar: `scoring.js`, `run.js`, `shop.js`, `deck.js`, `state.js`, CSS, UI. A loja
sorteia coringas por raridade e nunca repete possuídos — os novos entram
automaticamente. `corDoCoringa(id)` deriva cor do id — novos ganham cor sem trabalho.
Save: nenhum campo novo no shape da carta nem no coringa além de `estadoInicial`
(que já é serializado) — **sem bump de `VERSAO_SAVE`**.

## 8. Riscos e mitigação

- **Balanceamento:** valores copiados/adaptados do Balatro; ajuste fino não é objetivo
  deste lote (é conteúdo). Risco baixo.
- **Paridade do Ás (par/ímpar):** ponto de erro fácil — coberto por teste explícito.
- **`estencil` e dependência circular:** resolvido usando literal 5 (não importar
  `shop.js`).
- **Crescimento da suíte:** novos testes são de dados/pontuação, rápidos e
  determinísticos (exceto `misterioso`, testado por intervalo).

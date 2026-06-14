# Vouchers (upgrades permanentes) — BalatroJS

Data: 2026-06-14
Milestone: #3 do roadmap, **parte A** (só Vouchers). As Tags (bônus ao pular blind)
ficam para uma sub-milestone seguinte, com seu próprio spec/plano.

## Objetivo

Adicionar **Vouchers**: upgrades permanentes comprados na loja (1 slot por visita, $10
cada, únicos na run) que modificam economia/loja/rodada de forma passiva.

## Escopo

- 4 vouchers de efeito permanente e passivo.
- 1 slot de voucher por loja, sorteado entre os ainda não possuídos; a re-rolagem da loja
  **não** re-rola o voucher.
- Preço fixo `PRECO_VOUCHER = 10` para todos.
- Vouchers possuídos guardados em `state.vouchers` (array de ids).

## Não-escopo

- Tags (sub-milestone seguinte).
- Vouchers com estado interno ou efeito ativo (todos são consultas passivas de estado).
- Migração de saves: `VERSAO_SAVE` vai de 2 para 3; saves v2 são **descartados** ao
  carregar (comportamento atual para versão divergente). Sem código de migração.

## Modelo de dados

- `state.vouchers = []` em `criarRun` — array de ids (strings). Vouchers não têm estado
  interno, então não usam o formato `{id,dados}` dos Coringas.
- `VERSAO_SAVE` 2→3. `carregar()` já rejeita `dados.versao !== VERSAO_SAVE` → saves v2
  descartados sem código novo. `salvar` persiste `vouchers` (JSON puro) sem mudança.
- `js/data/vouchers.js`: os 4 vouchers, cada `{ id, nome, descricao }`, e
  `export const PRECO_VOUCHER = 10;`. Exportar `VOUCHERS` (objeto por id) e, se útil, a
  lista. Consulta de posse via `state.vouchers.includes(id)`.

## Os 4 vouchers e pontos de integração

1. **Bússola** (`bussola`) — re-rolagem inicial mais barata. Em `gerarLoja`,
   `precoRerolar` inicia em **3** se `state.vouchers.includes("bussola")`, senão 5.
2. **Juros+** (`juros-mais`) — teto de juros $5→$10. `juros(dinheiro, teto = 5)` ganha um
   parâmetro de teto **com default 5**; `recompensaBlind(tipo, maosRestantes, dinheiro,
   tetoJuros = 5)` idem. O chamador (em `run.js`) passa
   `state.vouchers.includes("juros-mais") ? 10 : 5`. Os defaults preservam os testes
   existentes em `tests/economy.test.js` (`juros(0)`, `recompensaBlind("pequena",2,10)`)
   sem alteração — backward-compatible.
3. **Liquidação** (`liquidacao`) — itens da loja custam $1 a menos (mínimo $1). Centralizar
   no helper `precoEfetivo(state, item)` em `shop.js`:
   `Math.max(1, item.preco - (state.vouchers.includes("liquidacao") ? 1 : 0))`. Usado em
   `comprarItem` (cobrança) e no render do botão "Comprar" (exibição) — uma fonte só.
   Não reescreve `item.preco` nos dados.
4. **Mãos+** (`maos-mais`) — +1 mão por rodada. Em `iniciarBlind`,
   `maosRestantes: MAOS_POR_BLIND + (state.vouchers.includes("maos-mais") ? 1 : 0)`.

## Loja: sorteio, compra, UI

### Sorteio (`gerarLoja` em `shop.js`)
- Além dos itens e do estado de pacote, definir `state.loja.voucher`:
  - escolher um voucher cujo id **não** esteja em `state.vouchers`;
  - se o jogador já tem todos os 4 → `state.loja.voucher = null`.
- A re-rolagem (`rerolar`) re-rola só os itens; **não** toca em `state.loja.voucher`.

### Compra (`comprarVoucher(state)` — nova em `shop.js`)
- `state.loja.voucher == null` → `{ erro: "vazio" }`.
- `state.dinheiro < PRECO_VOUCHER` → `{ erro: "sem-dinheiro" }`.
- senão: `state.dinheiro -= PRECO_VOUCHER`; `state.vouchers.push(state.loja.voucher.id)`;
  `state.loja.voucher = null`; `{}`.

### UI (`renderLoja` em `screens.js`, `render.js`)
- Cartão de voucher ao lado dos itens/pacote: nome + descrição (tooltip) + botão
  "Comprar $10" (desabilitado/oculto se `loja.voucher == null`).
- Linha discreta na loja listando os vouchers já possuídos (nomes), para o jogador
  lembrar o que tem.
- Botão "Comprar" dos itens normais usa `precoEfetivo(state, item)` no rótulo e na
  cobrança (reflete Liquidação).
- `css/cards.css`: estilo do cartão de voucher (cor própria, distinta de
  coringa/consumível).

## Tratamento de erros

- `comprarVoucher`: slot vazio ou sem dinheiro → `{erro}`; UI mostra `avisar(erro)`; nada
  é gasto. Reusa códigos `vazio`/`sem-dinheiro`.
- Saves v2 descartados (sem `vouchers`), então nenhum acesso a `vouchers` undefined em
  runtime.

## Testes (`tests/vouchers.test.js`, novo, importado em `tests/todos.js`)

- Dados: 4 vouchers com `id/nome/descricao`; `PRECO_VOUCHER === 10`.
- Bússola: `gerarLoja` com `vouchers:["bussola"]` → `loja.precoRerolar === 3`; sem → 5.
- Juros+: `juros(30)` → 5 (teto padrão); `juros(30, 10)` → 6; e `recompensaBlind` com
  teto 10 reflete o aumento.
- Liquidação: `precoEfetivo(state, {preco:3})` → 2 com o voucher, 3 sem; `{preco:1}` → 1
  com o voucher (nunca < 1).
- Mãos+: `iniciarBlind` com o voucher → `rodada.maosRestantes === MAOS_POR_BLIND + 1`.
- Sorteio: `gerarLoja` põe um voucher não-possuído; com os 4 possuídos → `voucher` null.
- `comprarVoucher`: sucesso debita $10, adiciona a `vouchers`, esvazia o slot; erros
  `vazio` (slot null) e `sem-dinheiro`.
- Determinismo: mesmo state+seed → mesmo voucher sorteado.

## Critérios de sucesso

1. A loja oferece 1 voucher por visita (entre os não possuídos); comprá-lo o torna
   permanente e o remove da prateleira; re-roll não o troca.
2. Cada um dos 4 efeitos funciona: re-roll mais barato (Bússola), juros até $10 (Juros+),
   itens -$1 (Liquidação), +1 mão por rodada (Mãos+).
3. Compra inválida (sem dinheiro/slot vazio) é bloqueada com aviso, sem gastar.
4. `node tests/todos.js` passa, com os novos testes (total > 94, 0 falhas).
5. `VERSAO_SAVE === 3`; saves v2 descartados sem quebrar a página.

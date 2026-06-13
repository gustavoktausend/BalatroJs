# Tarô e Espectrais (efeitos imediatos) — BalatroJS

Data: 2026-06-13
Milestone: #2 do roadmap (`2026-06-12-balatro-clone-design.md`).

## Objetivo

Adicionar dois novos tipos de consumível — **Tarô** e **Espectral** — com **efeitos
imediatos e sem alvo** (dinheiro, criar Coringa/Planeta, subir nível de mão), obtidos na
loja e em pacotes-surpresa. Não modificam cartas do baralho (decisão de escopo), então a
arquitetura atual do baralho (recriado a cada blind) permanece intacta.

## Escopo

- ~6 Tarôs + ~3 Espectrais, todos de efeito imediato, usáveis a qualquer momento (como
  planetas), sem selecionar cartas.
- Consumíveis representados como `{ tipo, id }` num único slot compartilhado
  (`MAX_CONSUMIVEIS = 2`, inalterado).
- Tarô/Espectral aparecem no sorteio de itens da loja E em pacotes-surpresa próprios.

## Não-escopo (explícito)

- Modificar cartas do baralho (transformar naipe/valor, bônus de chips por carta,
  destruir carta, edições/selos). Fica para uma milestone futura que exigiria baralho
  persistente.
- Consumíveis com alvo (que agem sobre cartas selecionadas na mão).
- Migração de saves antigos: saves v1 são **descartados** ao carregar (comportamento
  atual para versão divergente), oferecendo run nova. Sem código de migração.

## Modelo de dados e estado

- `state.consumiveis` passa de `string[]` (IDs de planeta) para `{ tipo, id }[]`, com
  `tipo ∈ {"planeta", "taro", "espectral"}`. `criarRun` já inicia `consumiveis: []`, sem
  mudança nessa linha.
- `VERSAO_SAVE` muda de `1` para `2`. `carregar()` já rejeita `dados.versao !==
  VERSAO_SAVE`, então saves v1 são descartados automaticamente — sem código novo.
- `salvar(state)` serializa `consumiveis` como está (`{tipo,id}` é JSON puro). Os
  Coringas continuam salvos por `{id, dados}` e religados por `id` no load.

### Novos dados

`js/data/taros.js` e `js/data/espectrais.js`. Cada consumível:

```
{ id, nome, descricao, preco, aplicar(state) -> {} | { erro } }
```

`aplicar` muta o estado e devolve `{}` em sucesso ou `{ erro }` se faltar recurso
(ex.: sem slot de Coringa). Usa `escolher`/`proximoAleatorio` (de `engine/rng.js`) para
qualquer aleatoriedade, preservando o determinismo por seed.

## Conteúdo

### Tarôs (6, preço $3)

1. **O Mundo** (`o-mundo`) — ganha +$20.
2. **A Estrela** (`a-estrela`) — sobe 1 nível de uma mão **aleatória** (`escolher` entre
   as chaves de `MAOS`).
3. **A Lua** (`a-lua`) — cria 1 Planeta aleatório no slot de consumível. Como o Tarô já
   saiu do slot antes de `aplicar` rodar (ver "Ordem de remoção"), há sempre ≥1 vaga;
   A Lua nunca falha por espaço.
4. **O Diabo** (`o-diabo`) — cria 1 Coringa **comum** aleatório (que o jogador ainda não
   tem). Erro `sem-espaco` se `coringas.length >= MAX_CORINGAS`; erro `vazio` se não há
   comum disponível.
5. **A Roda da Fortuna** (`a-roda`) — `proximoAleatorio(state) < 0.5` cria um Coringa
   **incomum** disponível (se houver slot e opção); caso contrário, +$5. Se rolou
   "criar" mas não há slot/opção, cai para +$5 (não falha).
6. **A Temperança** (`a-temperanca`) — ganha dinheiro = soma do valor de venda dos
   Coringas possuídos, com teto de $20. Sempre sucesso (mesmo com 0 Coringas → +$0).

### Espectrais (3, preço $4, raros)

1. **Aether** (`aether`) — sobe **2 níveis** de uma mão aleatória.
2. **Séance** (`seance`) — cria 1 Coringa **raro** aleatório disponível. Erro
   `sem-espaco` sem slot; erro `vazio` sem raro disponível.
3. **Wraith** (`wraith`) — cria 1 Coringa raro disponível **e zera o dinheiro**
   (`state.dinheiro = 0`). Erro `sem-espaco`/`vazio` como Séance (e nesse caso NÃO zera
   o dinheiro — falha antes de qualquer efeito).

### Ordem de remoção (contrato)

`usarConsumivel(state, indice)` para `taro`/`espectral`:
1. Lê o consumível em `state.consumiveis[indice]` e o **remove do slot** (`splice`).
2. Chama `def.aplicar(state)` — agora o slot já está livre, então um consumível que cria
   outro consumível (ex.: A Lua) sempre tem ≥1 vaga.
3. Se `aplicar` devolve `{erro}`, **reinsere** o consumível na posição original
   (`splice(indice, 0, consumivel)`) e devolve `{erro}` — efeito-nenhum, slot intacto.
4. Se sucesso, devolve `{}` (o consumível já saiu no passo 1).

Para `planeta`: lógica atual (sobe `niveisMaos`, dispara `aoUsarPlaneta` nos Coringas),
removendo o slot. Como planeta nunca falha, a ordem de remoção não importa aqui.

Consequência: A Lua e outros que criam consumível são checados **após** sua própria
remoção, então a vaga liberada os acomoda — A Lua nunca falha por espaço. Os efeitos de
`aplicar` que falham (Diabo/Séance/Wraith sem slot de Coringa) reinserem o consumível
intacto. Este caso (reinserção em erro) é testado.

## Mecânica de uso (engine)

`js/engine/run.js`:
- Renomear `usarPlaneta(state, indice)` → `usarConsumivel(state, indice)`.
- Dispatch por `state.consumiveis[indice].tipo`:
  - `planeta`: `state.niveisMaos[PLANETAS[id].mao] += 1`; dispara `aoUsarPlaneta` nos
    Coringas; remove slot; `{}`.
  - `taro`/`espectral`: remove o slot (`splice`); `const r = DEF.aplicar(state)`; se
    `r.erro`, reinsere o consumível na posição original e devolve `{erro}`; senão `{}`.
    (Ver "Ordem de remoção" para o porquê de remover antes de `aplicar`.)
- `usarPlaneta` deixa de ser export; todos os chamadores usam `usarConsumivel`.

## Loja e pacotes

`js/engine/shop.js`:
- `sortearItem(state)`: pesos por slot — ~45% Coringa, ~25% Planeta, ~22% Tarô, ~8%
  Espectral. Cada tipo cai para Coringa/Planeta se não houver opção disponível. Itens de
  Tarô/Espectral têm forma `{ tipo, id, preco }` (preço do dado).
- `comprarItem`: o check de slot para `taro`/`espectral` usa `MAX_CONSUMIVEIS` (mesmo de
  planeta); ao comprar, `state.consumiveis.push({ tipo, id })`.
- `comprarPacote`: 4 tipos de pacote por sorteio — Celestial (Planeta, 3 opções),
  Coringas (2 opções), Arcano (Tarô, 3 opções), Espectral (2 opções). Divisão sugerida:
  Celestial 30%, Coringas 30%, Arcano 30%, Espectral 10%. `state.pacote` ganha `tipo ∈
  {"planeta","coringa","taro","espectral"}` e `opcoes` (IDs).
- `escolherDoPacote`: dispatch — coringa via `adicionarCoringa`; planeta/taro/espectral
  via `state.consumiveis.push({ tipo, id })` com check `MAX_CONSUMIVEIS`.

## UI

`js/ui/render.js`:
- `elementoConsumivel(consumivel, indice)` recebe `{tipo, id}` (não mais string).
  Dispatch de rótulo/tooltip: planeta = nome + "sobe nível de X"; taro/espectral = nome +
  `descricao`. Classe CSS varia por tipo (`consumivel--planeta|taro|espectral`).
- A chamada de uso passa a `usarConsumivel`.
- `cartaoItem`: para item `taro`/`espectral`, renderiza via `elementoConsumivel({tipo,
  id})`.

`js/ui/screens.js`:
- `renderPacote`: título por tipo — "Pacote Celestial" / "Pacote de Coringas" / "Pacote
  Arcano" / "Pacote Espectral". Dispatch de elemento por tipo (coringa via
  `elementoCoringa`, demais via `elementoConsumivel({tipo, id})`).

`css/cards.css`: borda colorida leve por tipo de consumível.

## Tratamento de erros

- Consumível sem recurso (slot cheio, sem opção) → `{erro}`; UI mostra `avisar(erro)`; o
  consumível **permanece** no slot. Nenhum efeito parcial.
- Wraith só zera o dinheiro se o Coringa raro puder ser criado (checa antes).
- Códigos de erro reusam os existentes: `sem-espaco`, `vazio`.

## Testes

`tests/consumiveis.test.js` (novo, importado em `tests/todos.js`):
- Cada Tarô e Espectral: efeito correto no state com seed fixa (dinheiro somado, nível
  subido, item criado), e o caso "sem recurso" → `{erro}` sem aplicar efeito.
- `usarConsumivel`: dispatch por tipo; planeta dispara `aoUsarPlaneta`; sucesso remove o
  slot, erro não remove; A Lua não falha por espaço (substitui a si mesma).
- Determinismo: mesmo state+seed → mesmo resultado (ex.: A Estrela sobe sempre a mesma
  mão para uma seed dada).
- Loja/pacote: com seed fixa, o sorteio pode produzir Tarô/Espectral; `comprarPacote`
  gera pacotes dos 4 tipos.
- Wraith: zera dinheiro só em sucesso; não zera quando faltam slot/opção.

## Critérios de sucesso

1. Jogador encontra Tarôs/Espectrais na loja e em pacotes; pode comprar e usar.
2. Usar um consumível aplica o efeito correto; falta de recurso é bloqueada com aviso e
   não gasta o consumível.
3. Determinismo preservado (efeitos aleatórios reproduzíveis pela seed).
4. `node tests/todos.js` passa, com os novos testes (total > 81, 0 falhas).
5. Saves v1 são descartados sem quebrar a página; `VERSAO_SAVE === 2`.

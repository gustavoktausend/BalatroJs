# Polimento da v1 — BalatroJS

Data: 2026-06-12
Antecede: as 7 milestones futuras do roadmap (ver
`2026-06-12-balatro-clone-design.md`). Este documento cobre **apenas o polimento**
que fecha os pontos soltos da revisão final da v1, antes de abrir novos sistemas.

## Objetivo

Resolver os 3 *minors* anotados na revisão final da v1 (em
`docs/superpowers/plans/PROGRESSO.md`) e o refinamento de feedback associado, sem
introduzir novos sistemas de jogo. Ao fim, a v1 fica sem dependências externas em
runtime e com o feedback de recompensa que faltava.

## Escopo

Três frentes pequenas e independentes.

### Frente A — Aviso de recompensa ao vencer a blind (minor #2)

**Hoje:** `vencerBlind` (em `js/engine/run.js`) calcula e retorna `recompensa`, e
`jogar` repassa esse campo no objeto de resultado quando há `vitoriaBlind`. A UI
(`aoJogar` em `js/ui/screens.js`) recebe `resultado.recompensa` mas não exibe nada
— o jogador vai parar na loja sem ver quanto ganhou.

**Mudança:** após a animação da jogada vitoriosa e antes de `atualizar()` (que troca
para a tela de loja), exibir um aviso reusando o helper `avisar` de
`js/ui/render.js`. O texto deve mostrar o valor: por exemplo `"Blind vencida! +$8"`.

- `avisar(codigo)` hoje resolve `codigo` contra o dicionário `MENSAGENS` e, se não
  achar, exibe o código cru. Para uma mensagem dinâmica com valor, passamos o texto
  já formatado — `avisar` cai no ramo `MENSAGENS[codigo] || codigo` e exibe o texto.
  Não é preciso mudar a assinatura de `avisar`.
- A transição de tela (`state.fase` já vira `"loja"` dentro de `vencerBlind`) não
  muda; só adicionamos o toast antes do `atualizar()` em `aoJogar`.

**Sem novo teste de engine:** `run.test.js` já cobre que `vencerBlind` devolve
`recompensa`. Esta frente é puramente de UI.

### Frente B — Correção do `descricaoCoringa` (minor #3)

**Hoje:** `descricaoCoringa` (em `js/ui/render.js`) monta o sufixo "(atual: …)" com
três `if` independentes que **sobrescrevem** a mesma variável `extra`:

```js
if (dados.mult !== undefined) extra = ` (atual: +${dados.mult})`;
if (dados.x !== undefined)    extra = ` (atual: ×${dados.x})`;
if (dados.valor !== undefined) extra = ` (atual: $${dados.valor})`;
```

Um coringa hipotético com dois campos de `dados` (ex.: `mult` e `x`) mostraria só o
último. Nenhum dos 26 coringas atuais tem dois campos, mas a correção é trivial e
defensiva.

**Mudança:** acumular os fragmentos numa lista e juntá-los, em vez de sobrescrever:

```js
function descricaoCoringa(coringa) {
  const dados = coringa.dados;
  const partes = [];
  if (dados.mult !== undefined)  partes.push(`+${dados.mult}`);
  if (dados.x !== undefined)     partes.push(`×${dados.x}`);
  if (dados.valor !== undefined) partes.push(`$${dados.valor}`);
  const extra = partes.length ? ` (atual: ${partes.join(", ")})` : "";
  return coringa.def.descricao + extra;
}
```

**Teste:** `descricaoCoringa` vive em `js/ui/render.js`, que importa de `app.js` e
toca o DOM, então não é testável diretamente em Node. Para cobrir a lógica sem
arrastar a UI para os testes, **extrair a formatação do sufixo para uma função pura**
exportada e testável — por exemplo `sufixoEstado(dados)` num módulo sem dependência
de DOM (candidato natural: a própria `render.js` não serve; criar a função pura ao
lado dos dados de coringa ou num pequeno util). Decisão de implementação: extrair
`sufixoEstado(dados)` para `js/data/jokers.js` (já é onde mora a semântica dos
`dados` dos coringas) e importá-la em `render.js`. Então:

- `tests/data.test.js` (ou um caso novo) verifica:
  - `dados` vazio → sufixo vazio;
  - um campo → `" (atual: +5)"`, `" (atual: ×1.5)"`, `" (atual: $3)"`;
  - dois campos → `" (atual: +5, ×1.5)"` (o caso que hoje quebra).

### Frente C — Self-host das fontes (minor #1)

**Hoje:** `index.html` carrega `Press Start 2P` (peso 400) e `Rubik` (pesos 400/600/
800) do Google Fonts via `<link>`. É a única dependência externa em runtime; offline
o app degrada para as fontes do sistema.

**Mudança:** baixar os `.woff2` e servi-los do próprio repositório.

- Nova pasta `fonts/` na raiz com os arquivos `.woff2`:
  - Press Start 2P 400 (subsets latin + latin-ext, para cobrir acentos PT-BR).
  - Rubik 400, 600, 800 (subsets latin + latin-ext).
- Novo arquivo `css/fonts.css` com as regras `@font-face` apontando para `fonts/…`
  com `font-display: swap`. Incluído no `<head>` antes dos outros CSS.
- Remover do `index.html` os três `<link>` para `fonts.googleapis.com` /
  `fonts.gstatic.com` e o `preconnect`.
- Os nomes de família (`'Press Start 2P'`, `'Rubik'`) usados no CSS atual não mudam,
  então `base.css`/`screens.css` não precisam de ajuste além de garantir um *stack*
  de fallback decente já presente.

**Fonte dos arquivos:** baixados via o endpoint CSS do Google Fonts (URLs `.woff2`
em `fonts.gstatic.com`, obtidas com User-Agent moderno). Subsets latin + latin-ext.

**Observação de licença:** ambas as fontes são OFL (SIL Open Font License), que
permite redistribuição. Adicionar um `fonts/OFL.txt` (ou nota no README) creditando
as fontes e a licença.

**Teste:** não há teste automatizado de fontes; a verificação é manual (carregar a
página offline e confirmar que as fontes aplicam). Documentar no checklist de
verificação visual.

## Não-escopo (explicitamente fora)

- Qualquer milestone nova (fundo animado, Tarô/Espectrais, vouchers, baralhos,
  mobile, i18n, seed compartilhável). Vêm depois, cada uma com seu spec.
- Mudanças de balanceamento ou novo conteúdo de jogo.
- Refatorações não relacionadas aos 3 minors.

## Arquitetura / impacto

- `js/engine/run.js`: inalterado (já devolve `recompensa`).
- `js/ui/screens.js`: `aoJogar` ganha o toast de recompensa. ~2 linhas.
- `js/ui/render.js`: `descricaoCoringa` passa a usar `sufixoEstado` importada.
- `js/data/jokers.js`: nova função pura exportada `sufixoEstado(dados)`.
- `index.html`: remove links externos de fonte; adiciona `<link>` para `css/fonts.css`.
- `css/fonts.css`: novo, com `@font-face`.
- `fonts/`: novos `.woff2` + `OFL.txt`.
- `tests/data.test.js`: casos para `sufixoEstado`.
- `README.md`: nota de que as fontes são self-hosted (remove a ressalva de offline).

Mantém as convenções do projeto: código/comentários em PT-BR, zero dependências de
runtime (agora literalmente zero, inclusive fontes), ES modules sem build.

## Critérios de sucesso

1. Ao vencer qualquer blind, o jogador vê um aviso com o valor ganho (`+$N`) antes
   de chegar à loja.
2. `sufixoEstado` é uma função pura testada, e `descricaoCoringa` mostra todos os
   campos de `dados` presentes (corrige o caso de dois campos).
3. O app carrega e renderiza com as fontes corretas **sem acesso à internet**.
4. `node tests/todos.js` continua passando, agora com os casos novos de
   `sufixoEstado` (total > 71, 0 falhas).

## Ordem de execução sugerida

B (correção + teste, mais rápida e fechada) → A (toast de UI) → C (fontes, mais
arquivos). Cada frente é commit separado.

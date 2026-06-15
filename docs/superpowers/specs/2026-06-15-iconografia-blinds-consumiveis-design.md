# Design: Iconografia de blinds e consumíveis

**Data:** 2026-06-15
**Status:** aprovado para planejamento

## Contexto

Hoje os blinds (apostas) e os consumíveis (planeta/tarô/espectral) são exibidos
como caixas coloridas só com texto — sem iconografia. O único ícone do projeto é o
chapéu de jester dos coringas (`svgCoringa` em `render.js`). O usuário quer que cada
blind e cada consumível ganhe um ícone visual, na filosofia "zero asset" do projeto
(nada externo; tudo gerado no código, na paleta atual).

**Fidelidade:** "inspirado" — dar identidade visual a esses itens com símbolos
temáticos, sem copiar pixel-art/assets do Balatro.

## Decisão: glifos Unicode temáticos

Em vez de SVG desenhado à mão (custoso para ~18 consumíveis), usar **glifos Unicode
de texto** coerentes com cada item. São símbolos de texto (não emoji colorido), que
renderizam na fonte self-hospedada do projeto (Rubik). São leves, instantâneos e
alinhados ao "zero asset".

## Onde o dado vive: campo `icone` no objeto de dados

Fonte única de verdade — o glifo fica junto da definição de cada item:
- `js/data/planets.js` — `icone` em cada um dos 9 planetas.
- `js/data/taros.js` — `icone` em cada um dos 6 (na `LISTA`).
- `js/data/espectrais.js` — `icone` em cada um dos 3 (na `LISTA`).
- Os 3 glifos de blind ficam num mapa `ICONE_BLIND` em `js/ui/screens.js`, ao lado
  do `NOME_BLIND` que já existe. `js/data/bosses.js` NÃO muda (chefe usa glifo
  genérico).

## Glifos escolhidos

**Planetas** (símbolos astronômicos reais):

| Planeta  | Glifo | Planeta | Glifo | Planeta | Glifo |
|----------|-------|---------|-------|---------|-------|
| Plutão   | ♇     | Vênus   | ♀     | Urano   | ♅     |
| Mercúrio | ☿     | Marte   | ♂     | Netuno  | ♆     |
| Saturno  | ♄     | Júpiter | ♃     | Terra   | ⊕     |

**Tarôs:**

| Tarô        | Glifo | Tarô          | Glifo |
|-------------|-------|---------------|-------|
| O Mundo     | ✷     | O Diabo       | ⛧     |
| A Estrela   | ★     | A Roda        | ☸     |
| A Lua       | ☾     | A Temperança  | ⚖     |

**Espectrais:** Aether ✦ · Seance ❂ · Wraith ☄

**Blinds:** pequena ● · grande ◆ · chefe ☠ (genérico para os 12 chefes).

> Nota: alguns glifos (⛧, ☸, ❂, ☄) são menos universais. Como o projeto
> self-hospeda fontes, o risco de cair em "□" é baixo, mas a validação no navegador
> DEVE confirmar que todos renderizam de fato. Se algum não renderizar, trocar por
> equivalente legível.

## Apresentação visual

**Consumível** (caixa `.consumivel`, 96×124 no desktop): hoje um `<span>` com o nome
no rodapé. O ícone vira um glifo grande no CENTRO da caixa (como o jester ocupa o
centro do coringa), com o nome embaixo.
- Novo `<span class="icone-consumivel" aria-hidden="true">` com o glifo, antes do
  `<span>` do nome.
- `font-size` grande; herda a cor do tipo (planeta azul / tarô roxo / espectral
  ciano — já definidas em `.consumivel--*`).

**Blind** (na seleção `cartaoBlind` e na lateral `painelLateral`/cartucho): o glifo
aparece ANTES do nome, num `<span class="icone-blind" aria-hidden="true">` dentro do
`<h3>`. Chefe permanece em `--vermelho` (regra já existente).

```
Consumível:              Seleção de blind:        Lateral (rodada):
┌──────────┐             ┌─────────────┐          ┌──────────────┐
│          │             │ ● Aposta    │          │ ☠ O Gancho   │
│    ♀     │ ← glifo     │   Pequena   │          └──────────────┘
│          │   central   │ Alvo: 300   │
│  Vênus   │ ← nome      │ Prêmio: $3  │
└──────────┘             └─────────────┘
```

## Pontos de mudança (mínimos)

- **Consumíveis:** só `elementoConsumivel` (`render.js`) — cobre fileira de
  consumíveis (rodada e loja), item à venda na loja, e pacotes, de uma vez.
- **Blinds:** `cartaoBlind` (seleção) e `painelLateral` (cartucho da lateral), ambos
  em `screens.js`.
- **CSS:** `.icone-consumivel` (em `css/cards.css`, junto de `.consumivel`) e
  `.icone-blind` (em `css/screens.css`).

## Responsivo

O glifo central do consumível escala com a caixa: `.icone-consumivel` usa `rem`, que
reduz nos breakpoints existentes (`@media 900px`/`600px` de `cards.css`) junto com o
nome. O glifo de blind é inline no `<h3>` e acompanha o texto. Sem risco novo de
overflow (são glifos, não caixas).

## Acessibilidade

Os glifos são decorativos (o nome textual está sempre presente ao lado/embaixo), por
isso recebem `aria-hidden="true"` — leitores de tela leem o nome, não o símbolo.

## Não-objetivos

- Glifo próprio por chefe (fica genérico ☠ para os 12).
- Ícones para coringas (já têm o jester).
- Mudança em regras de jogo ou no save (`VERSAO_SAVE` permanece; o save serializa só
  ids, não as definições — `icone` é puramente apresentação).
- Assets externos / pixel-art.
- SVG desenhado à mão.

## Testes e validação

- **Suíte automatizada:** adicionar `icone` aos dados é aditivo, sem regra nova.
  Incluir UM teste de dados garantindo que todo planeta, tarô e espectral tem o campo
  `icone` (string não vazia) — pega esquecimento ao adicionar item futuro. Estilo do
  harness (`tests/`), sem framework. A suíte sobe de **112** para **113**.
  - Nota de implementação do teste: `PLANETAS`, `TAROS` e `ESPECTRAIS` são todos
    exportados como objeto/mapa `id → def` (tarôs/espectrais via
    `Object.fromEntries(LISTA…)`). O teste itera `Object.values(...)` de forma
    uniforme nos três. Como tarôs/espectrais espalham `...t`/`...e` da `LISTA` para o
    mapa final, basta adicionar `icone` na `LISTA` que ele aparece em `TAROS`/
    `ESPECTRAIS`. Os blinds NÃO entram nesse teste (o `ICONE_BLIND` é um mapa de UI
    com 3 chaves fixas, sem risco de crescer).
- **Validação no navegador (chrome-devtools MCP):**
  - Seleção de blind: ● Pequena, ◆ Grande, ☠ Chefe antes do nome.
  - Lateral na rodada: glifo do blind atual no cartucho.
  - Loja e fileira de consumíveis: glifo central nos planetas/tarôs/espectrais.
  - **Confirmar que NENHUM glifo cai em "□"** (renderização real na fonte
    self-hospedada). Se algum falhar, trocar por equivalente.
  - Desktop e mobile (o glifo escala com a caixa do consumível).

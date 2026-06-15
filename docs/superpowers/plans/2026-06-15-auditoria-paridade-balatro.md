# Auditoria de paridade com o Balatro + backlog priorizado

> **Documento de planejamento de longo prazo.** Não é um plano de implementação
> executável task-a-task — é a auditoria do estado atual vs. o Balatro original e um
> backlog priorizado. Cada item marcado com 🎯 abaixo deve virar seu PRÓPRIO ciclo
> brainstorm → spec → plano → implementação (subagent-driven), um de cada vez.
>
> **Para retomar após um `/clear`:** leia este arquivo + `PROGRESSO.md` (mesma pasta).
> O estado do código está descrito em cada linha "Hoje:". Confirme contra o código
> antes de implementar (pode ter mudado).

**Data:** 2026-06-15
**Branch:** `main` (sincronizada com origin; deploy via GitHub Pages)

---

## 1. Resumo executivo

O BalatroJS é um clone de estudo **funcionalmente completo do loop central**: jogar
mãos de pôquer → pontuar (chips × mult) → vencer blinds → loja → progredir antes até
o ante 8. Tem coringas, planetas, tarôs, espectrais, chefes, baralhos, stakes,
vouchers, save, seed compartilhável, animação de pontuação, e UI responsiva.

**Os maiores gaps de paridade são de CONTEÚDO (quantidade) e de SISTEMAS de
modificação de carta** — não do loop central. O original tem ~150 coringas (temos
25), e sistemas inteiros ausentes: **aprimoramentos de carta** (bonus/mult/wild/
glass/steel/gold/stone), **edições** (foil/holographic/polychrome/negative) e
**selos** (seals). Esses três sistemas são o que dá profundidade ao "deck building"
do Balatro e hoje não existem.

---

## 2. Tabela de paridade

Legenda: ✅ existe · 🟡 parcial · ❌ ausente

### Loop central e regras

| Sistema | Balatro | Hoje (BalatroJS) | Status |
|---|---|---|---|
| Mãos de pôquer | 12 (inclui 5-de-um-tipo, flush house, flush five) | 9 padrão (`hands.js`) | 🟡 faltam as 3 secretas |
| Detecção de mão | completa | completa (`poker.js`) | ✅ |
| Pipeline chips×mult | completo, com ordem de gatilhos | completo (`scoring.js`) | ✅ |
| Níveis de mão (planetas) | sim | sim (`niveisMaos`) | ✅ |
| Escala de ante / alvos | até ante 8 + endless | `BASES` até ante 8, vitória no ante 8, **sem endless** | 🟡 sem modo infinito |
| Mãos/descartes por rodada | 4/3 base + modificadores | 4/3 + baralho/voucher (`run.js`) | ✅ |
| Economia (juros, prêmios) | juros teto $5 (×2 c/ voucher) | `economy.js` igual | ✅ |
| Save / continuar | sim | `localStorage` (`state.js`) | ✅ |
| Seed compartilhável | sim | sim (`seed.js`) | ✅ |

### Conteúdo (quantidade)

| Conteúdo | Balatro | Hoje | Status |
|---|---|---|---|
| Coringas (jokers) | ~150 | 25 (`jokers.js`) | 🟡 ~17% |
| Planetas | 12 (1 por mão, inclui as secretas) | 9 (`planets.js`) | 🟡 faltam 3 |
| Tarôs | 22 | 6 (`taros.js`) | 🟡 ~27% |
| Espectrais | 18 | 3 (`espectrais.js`) | 🟡 ~17% |
| Chefes (boss blinds) | ~28 | 8 (`bosses.js`: gancho, parede, cabeca, aguilhao, janela, taco, vidente, boca) | 🟡 ~29% |
| Baralhos | 15 | 4 (`baralhos.js`: padrão, vermelho, azul, amarelo) | 🟡 ~27% |
| Stakes | 8 | 3 (`stakes.js`: branco, vermelho, dourado) | 🟡 faltam 5 |
| Vouchers | 32 (16 pares base→upgrade) | 4 (`vouchers.js`: bussola, juros-mais, liquidacao, maos-mais) | 🟡 ~12% |
| Tags (de pulo) | ~24 | 0 | ❌ |

### Sistemas de modificação de carta (os grandes ausentes)

| Sistema | Balatro | Hoje | Status |
|---|---|---|---|
| Aprimoramentos de carta | bonus, mult, wild, glass, steel, gold, stone, lucky | nenhum | ❌ |
| Edições | foil (+chips), holographic (+mult), polychrome (×mult), negative (+slot) | nenhuma (em cartas e coringas) | ❌ |
| Selos (seals) | gold, red, blue, purple | nenhum | ❌ |

### Loja, pacotes e meta

| Sistema | Balatro | Hoje | Status |
|---|---|---|---|
| Loja (itens, reroll, voucher) | sim | sim (`shop.js`) | ✅ |
| Pacotes (booster) | Celestial, Arcano, Padrão, Coringa(Buffoon), Espectral + tamanhos Jumbo/Mega | Planeta, Coringa, Tarô, Espectral — **sem pacote Padrão (cartas), sem Jumbo/Mega** (`shop.js:139`) | 🟡 |
| Slots de coringa/consumível | 5 / 2 base, expansível | `MAX_CORINGAS`/`MAX_CONSUMIVEIS` fixos | 🟡 sem expansão |
| Vender/reordenar coringas | sim (drag) | sim (`render.js`) | ✅ |
| Estatísticas de fim de run | sim | parcial (`estatisticas`) | 🟡 |

### UI / visual / polimento

| Aspecto | Balatro | Hoje | Status |
|---|---|---|---|
| Cartas, mão, animação de pontuação | rico | sim, com animação por evento (`animate.js`) | ✅ |
| Baralho na mesa (verso + contagem) | sim | sim (Etapa 2 do layout) | ✅ |
| Ícones de blind/consumível | arte própria | glifos Unicode (feito 2026-06-15) | ✅ (nosso estilo) |
| Ícone de coringa | arte própria | SVG jester procedural (`render.js`) | ✅ (nosso estilo) |
| Fundo animado | sim | sim (`fundo.js`) | ✅ |
| Responsivo mobile | sim | sim (≤900/≤600) | ✅ |
| Tooltips | sim | sim (`tooltip.js`) | ✅ |
| Feedback de edição/selo/aprimoramento na carta | sim (cores/brilho) | n/a (sistemas ausentes) | ❌ depende dos sistemas acima |

---

## 3. Backlog priorizado

Ordenado por **impacto na sensação de "é Balatro" ÷ esforço**. Cada 🎯 é um projeto
próprio (brainstorm → spec → plano → implementação). Marcados P1 (alto) a P3 (baixo).

### P1 — alto impacto

- 🎯 **(P1) Aprimoramentos de carta** — sistema de `enhancement` na carta (bonus,
  mult, wild, glass, steel, gold, stone, lucky). É o sistema ausente de maior
  impacto: muda pontuação, deck building e a cara das cartas. Toca `deck.js`
  (shape da carta), `scoring.js` (efeitos no pipeline), `poker.js` (wild = qualquer
  naipe), tarôs que aplicam aprimoramento, e CSS das cartas. **Maior projeto da
  lista — provavelmente quebrar em sub-etapas** (ex.: shape+pontuação primeiro,
  depois fonte via tarôs, depois visual).
- 🎯 **(P1) Edições** (foil/holographic/polychrome/negative) — em cartas e coringas.
  Mecânica relativamente isolada (um campo `edicao` + efeito no pipeline + visual
  brilhante). Alto impacto visual e estratégico, esforço médio.
- 🎯 **(P1) Mais coringas** — subir de 25 para ~50+. O conteúdo que mais "enche" o
  jogo. Aditivo e de baixo risco (cada coringa é um objeto com ganchos; o pipeline
  já suporta). Pode ser feito em lotes. **Bom primeiro projeto pós-auditoria** por
  ser puro conteúdo, baixo risco, e o motor já aguenta.

### P2 — médio impacto

- 🎯 **(P2) Selos (seals)** — gold/red/blue/purple na carta. Sistema pequeno, encaixa
  junto ou depois dos aprimoramentos (mesmo campo de "modificadores da carta").
- 🎯 **(P2) Mais conteúdo de consumível** — tarôs (6→~22), espectrais (3→~18),
  planetas (9→12 com as mãos secretas). Muitos tarôs/espectrais DEPENDEM de
  aprimoramentos/edições/selos existirem (ex.: tarôs que aplicam enhancement), então
  vem DEPOIS de P1.
- 🎯 **(P2) Mãos secretas** (5-de-um-tipo, flush house, flush five) + os 3 planetas
  correspondentes. Toca `poker.js`/`hands.js`. Pré-requisito de alguns coringas.
- 🎯 **(P2) Mais chefes** (8→~28) e **mais baralhos** (4→15). Conteúdo aditivo; alguns
  chefes/baralhos dependem de sistemas de P1 (ex.: baralho que dá selo/edição).
- 🎯 **(P2) Pacote Padrão (cartas) + tamanhos Jumbo/Mega** — depende de
  aprimoramentos/edições para o pacote de cartas fazer sentido.

### P3 — menor impacto / polimento

- 🎯 **(P3) Tags de pulo** — recompensa ao pular blind. Sistema novo de meta.
- 🎯 **(P3) Modo endless** (pós-ante 8) + escala de alvo infinita.
- 🎯 **(P3) Mais vouchers** (4→32, com upgrades) e **mais stakes** (3→8).
- 🎯 **(P3) Expansão de slots** de coringa/consumível (voucher/negative edition).
- 🎯 **(P3) Tela de estatísticas de fim de run** mais rica.

---

## 4. Dependências entre itens (ordem sugerida)

```
Mais coringas (P1) ─── independente, pode começar já
                       (alguns coringas novos podem querer edições; fazer os
                        que não dependem primeiro)

Aprimoramentos de carta (P1) ──┬──> Selos (P2)
                               ├──> Tarôs/espectrais que aplicam modificadores (P2)
                               ├──> Pacote Padrão de cartas (P2)
                               └──> Chefes/baralhos que usam modificadores (P2)

Edições (P1) ──────────────────┴──> idem (consumíveis/coringas com edição)

Mãos secretas (P2) ──> 3 planetas secretos + coringas que as referenciam
```

**Recomendação de sequência:** começar por **Mais coringas (P1)** — puro conteúdo,
baixo risco, motor pronto, dá retorno visível rápido. Em paralelo conceitual, o
próximo grande é **Aprimoramentos de carta (P1)**, que destrava boa parte do P2.

---

## 5. Notas de arquitetura (para quem for implementar)

- **Shape da carta** (`deck.js`): hoje `{ id, naipe, valor }`. Aprimoramentos/
  edições/selos adicionam campos (ex.: `aprimoramento`, `edicao`, `selo`). Isso
  **afeta o save** (`state.js`) e o embaralhamento — exige bump de `VERSAO_SAVE` e
  migração/limpeza de saves antigos.
- **Pipeline de pontuação** (`scoring.js`): já emite `eventos` em ordem para a
  animação. Novos efeitos (chips de foil, ×mult de polychrome, mult de steel em mão,
  etc.) entram como novos `aplicar(...)` no ponto certo do loop. A ordem dos gatilhos
  importa para fidelidade.
- **Coringas** (`jokers.js`): cada um é `{ id, nome, raridade, preco, descricao,
  ganchos: { aoPontuarCarta, aoPontuarMao, aoFimDaRodada, ... } }`. Adicionar coringa
  é aditivo; novos ganchos podem ser necessários para mecânicas novas.
- **Testes:** harness próprio (`tests/harness.js` → `teste/ok/igual`), sem framework.
  Hoje **113 testes**. Conteúdo novo deve vir com testes de dados (como o de `icone`);
  mecânicas novas com testes de pontuação no estilo de `scoring`/`run`.
- **Convenções do projeto:** PT-BR em código/comentários; zero deps; ES modules sem
  build; trailer de commit `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`;
  workflow subagent-driven (implementador → revisor spec → revisor qualidade →
  revisão final); merge `--no-ff` + push (usuário acompanha pelo deploy).

---

## 6. Como retomar (checklist pós-`/clear`)

1. Ler este arquivo + `docs/superpowers/plans/PROGRESSO.md`.
2. Escolher UM item 🎯 do backlog (recomendado: começar por "Mais coringas (P1)").
3. Rodar a skill de brainstorming para esse item → spec → plano → implementação.
4. Confirmar cada "Hoje:" contra o código real antes de implementar (pode ter mudado).
5. `node tests/todos.js` deve estar verde (113 ao escrever isto) antes de começar.

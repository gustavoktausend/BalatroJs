# BalatroJs — Design da v1 (Núcleo Jogável)

Data: 2026-06-12
Status: aguardando aprovação

## Visão geral

Clone do núcleo jogável de Balatro em JavaScript, HTML e CSS puros, sem build e sem
dependências, hospedado no GitHub Pages. Interface em português (BR), layout para
desktop (mínimo ~1280×720), visual inspirado no original (paleta escura, cartas em
CSS, fonte pixelada) **sem** usar assets do jogo. Save automático da run via
`localStorage`.

Fora do escopo da v1 (milestones futuras): fundo animado (shader), cartas de
Tarô/Espectral, vouchers, tags ao pular blind, edições/selos, baralhos alternativos,
stakes, layout mobile, troca de idioma.

## Regras do jogo

### Estrutura da run

- **8 antes** para vencer. Cada ante tem 3 blinds: **Aposta Pequena** (alvo ×1),
  **Aposta Grande** (×1,5) e **Chefe** (×2, exceto A Parede: ×4).
- Pontuação-alvo base por ante: `300, 800, 2000, 5000, 11000, 20000, 35000, 50000`.
- Aposta Pequena e Grande podem ser **puladas** (sem recompensa; tags são milestone
  futura). O Chefe é obrigatório.
- Dinheiro inicial: **$4**.

### Rodada (blind)

- Baralho padrão de **52 cartas**, embaralhado no início de cada blind.
- Mão de **8 cartas**; o jogador seleciona até 5 e escolhe **Jogar** ou **Descartar**.
- **4 mãos** e **3 descartes** por blind (base; Coringas/Chefes podem alterar).
- Vitória: pontuação acumulada ≥ alvo (sobras de mãos viram dinheiro).
- Derrota: mãos esgotadas sem atingir o alvo → tela de fim de run.

### Recompensa ao vencer uma blind

- Prêmio fixo: Pequena **$3**, Grande **$4**, Chefe **$5**.
- **+$1** por mão não usada.
- **Juros:** +$1 a cada $5 guardados, máximo **$5** (a partir de $25).

### Mãos de pôquer (9) e níveis

Cada mão tem chips e mult base (nível 1) e cresce ao usar a carta de Planeta
correspondente. Sequência Real é exibida como nome, mas usa o nível de Sequência de
Naipe (como no original).

| Mão | Chips×Mult (nv.1) | Por nível | Planeta |
|---|---|---|---|
| Carta Alta | 5 × 1 | +10 / +1 | Plutão |
| Par | 10 × 2 | +15 / +1 | Mercúrio |
| Dois Pares | 20 × 2 | +20 / +1 | Urano |
| Trinca | 30 × 3 | +20 / +2 | Vênus |
| Sequência | 30 × 4 | +30 / +3 | Saturno |
| Naipe (Flush) | 35 × 4 | +15 / +2 | Júpiter |
| Full House | 40 × 4 | +25 / +2 | Terra |
| Quadra | 60 × 7 | +30 / +3 | Marte |
| Sequência de Naipe | 100 × 8 | +40 / +4 | Netuno |

### Pontuação de uma jogada

1. Detecta a melhor mão de pôquer entre as cartas selecionadas.
2. Começa com chips e mult do nível atual da mão.
3. Cada carta **que participa da mão** soma seus chips (2–10 = valor; J/Q/K = 10;
   Ás = 11) e dispara ganchos `aoPontuarCarta` dos Coringas, na ordem dos slots.
4. Ao final, ganchos `aoPontuarMao` dos Coringas (na ordem dos slots) aplicam
   `+chips`, `+mult` e `×mult`.
5. Total da jogada = `chips × mult` (arredondado para baixo).

## Loja

Aparece após cada blind vencida (não aparece ao pular).

- **2 cartas à venda:** cada slot sorteia Coringa (70%) ou Planeta (30%).
  Coringas já possuídos não aparecem.
- **1 pacote-surpresa ($4):** tipo sorteado 50/50 —
  *Pacote Celestial* (escolha 1 entre 3 Planetas) ou *Pacote Arcano de Coringas*
  (escolha 1 entre 2 Coringas).
- **Re-rolar:** $5 na primeira vez, +$1 a cada uso na mesma visita (re-rola só os
  2 slots de cartas).
- **Preços:** Planeta $3; Coringa comum $3–5, incomum $6–7, raro $8–9.
- **Vender Coringa:** devolve `teto(preço/2)`.
- Sorteio de raridade nos slots de Coringa: comum 70%, incomum 25%, raro 5%.
- Não é possível comprar sem espaço (5 slots de Coringa, 2 de consumíveis) nem sem
  dinheiro (sem dívida na v1).

## Planetas (9)

Consumíveis de $3. Ao usar, sobe 1 nível da mão correspondente (tabela acima).
Podem ser usados na hora ou guardados nos 2 espaços de consumíveis. Mostram o nível
atual da mão no tooltip.

## Coringas (25)

Espaço para 5. A **ordem dos slots importa** (arrastar para reordenar). Tooltip com
descrição; clique abre opção de vender. Efeitos implementados como dados + funções
puras com os ganchos: `aoPontuarCarta(carta, ctx)`, `aoPontuarMao(ctx)`,
`aoDescartar(ctx)`, `aoFimDaRodada(ctx)`, `aoVencerBlind(ctx)`.

### Comuns (14)

| # | Nome | Efeito | Preço |
|---|---|---|---|
| 1 | Coringa | +4 mult | $3 |
| 2 | Coringa Ganancioso | +3 mult por carta de Ouros pontuada | $4 |
| 3 | Coringa Voraz | +3 mult por carta de Copas pontuada | $4 |
| 4 | Coringa Colérico | +3 mult por carta de Espadas pontuada | $4 |
| 5 | Coringa Guloso | +3 mult por carta de Paus pontuada | $4 |
| 6 | Par Certeiro | +50 chips se a mão jogada contém um Par | $4 |
| 7 | Mente Brilhante | +80 chips se a mão jogada contém Dois Pares | $4 |
| 8 | Coringa Maluco | +12 mult se a mão jogada contém uma Sequência | $4 |
| 9 | Trinca Forte | +10 mult se a mão jogada contém uma Trinca | $4 |
| 10 | Meio Coringa | +20 mult se a jogada tem 3 cartas ou menos | $5 |
| 11 | Estandarte | +30 chips por descarte restante | $5 |
| 12 | Cume Místico | +15 mult quando há 0 descartes restantes | $5 |
| 13 | Cara Amigável | +5 mult por figura (J/Q/K) pontuada | $4 |
| 14 | Banqueiro | +2 mult a cada $5 que você possui (máx. +20) | $5 |

### Incomuns (8)

| # | Nome | Efeito | Preço |
|---|---|---|---|
| 15 | Coringa Verde | +1 mult por mão jogada na run; −1 mult por descarte usado (mín. 0) | $6 |
| 16 | Supernova | soma ao mult o nº de vezes que a mão jogada já foi jogada na run | $6 |
| 17 | Foguete | dá $1 ao fim da rodada; o valor aumenta +$2 (permanente) ao vencer um Chefe | $6 |
| 18 | Constelação | ×mult; começa em ×1 e ganha +0,1 a cada Planeta usado | $7 |
| 19 | Mãos Limpas | ×1,5 mult se nenhum descarte foi usado nesta rodada | $7 |
| 20 | Fotografia | a primeira figura pontuada na jogada dá ×2 mult | $6 |
| 21 | Gros Michel | +15 mult; chance de 1 em 6 de se destruir ao fim da rodada | $6 |
| 22 | Trapaceiro | ×2 mult se a mão jogada já havia sido jogada nesta rodada | $7 |

### Raros (3)

| # | Nome | Efeito | Preço |
|---|---|---|---|
| 23 | Cavendish | ×3 mult; chance de 1 em 12 de se destruir ao fim da rodada | $8 |
| 24 | Obelisco | ganha ×0,2 mult a cada mão jogada diferente da anterior; volta a ×1 ao repetir | $8 |
| 25 | Holograma | ×1,5 mult; ganha +0,25× a cada Coringa comprado | $9 |

## Chefes (8)

Um por ante, sorteado sem repetição na run. Mesmo padrão de ganchos dos Coringas.

| Nome | Efeito |
|---|---|
| O Gancho | descarta 2 cartas aleatórias da sua mão após cada jogada |
| A Parede | alvo da blind ×4 (em vez de ×2) |
| A Cabeça | cartas de Copas não pontuam |
| O Aguilhão | cartas de Espadas não pontuam |
| A Janela | cartas de Ouros não pontuam |
| O Taco | cartas de Paus não pontuam |
| A Vidente | só aceita jogadas de exatamente 5 cartas |
| A Boca | só permite jogar o primeiro tipo de mão jogado na rodada |

## Interface

### Layout da tela de rodada

- **Barra lateral esquerda:** blind atual (nome, alvo, prêmio), pontuação acumulada,
  mão detectada em tempo real com `chips × mult` (azul × vermelho), contadores de
  mãos/descartes, dinheiro, ante/rodada.
- **Topo central:** 5 slots de Coringas + 2 de consumíveis. Tooltip no hover,
  arrastar para reordenar, clique para vender/usar.
- **Centro:** cartas jogadas com animação de pontuação carta a carta (números
  subindo, carta "pula" — CSS transitions/keyframes).
- **Base:** mão de 8 cartas em leque; clique seleciona (máx. 5); botões **Jogar** e
  **Descartar**; ordenar por valor/naipe; contador do baralho (clicável: lista as
  cartas restantes).

### Telas

Uma `<section>` por tela, exibida conforme `state.fase`:

1. **Título** — logo, "Jogar" / "Continuar" (se houver save).
2. **Seleção de blind** — as 3 blinds do ante, com alvo, prêmio e Jogar/Pular.
3. **Rodada** — descrita acima.
4. **Loja** — itens, re-rolar, "Próxima rodada".
5. **Pacote-surpresa** — escolher 1 entre as opções.
6. **Fim de run** — vitória (após o Chefe do ante 8) ou derrota; estatísticas
   (melhor jogada, mão mais usada, ante alcançado) e "Nova run".

### Estilo

- Cartas 100% em CSS/HTML (valor + naipe nos cantos, pip central), cantos
  arredondados, sombra.
- Fonte pixelada do Google Fonts (ex.: "Press Start 2P") para números de pontuação.
- Paleta em variáveis CSS: fundo verde-escuro de feltro, painéis cinza-azulados,
  vermelho para mult/descartar, azul para chips/jogar, dourado para dinheiro.
- Fundo estático (shader animado é milestone futura).

## Arquitetura

### Estrutura de arquivos

```
BalatroJs/
├── index.html
├── css/
│   ├── base.css        # reset, variáveis de paleta, fontes
│   ├── cards.css       # carta de baralho, Coringas, consumíveis
│   └── screens.css     # layout das 6 telas
├── js/
│   ├── main.js         # boot: carrega save ou cria run, eventos globais
│   ├── state.js        # criação do estado + save/load (localStorage)
│   ├── engine/
│   │   ├── deck.js     # criar baralho, embaralhar, comprar cartas
│   │   ├── poker.js    # detectar a mão de pôquer das cartas selecionadas
│   │   ├── scoring.js  # pipeline chips×mult (cartas → Coringas → total)
│   │   ├── economy.js  # prêmios, juros, compra/venda
│   │   └── blinds.js   # alvos por ante, sorteio e efeitos de Chefes
│   ├── data/
│   │   ├── hands.js    # chips/mult base e por nível das 9 mãos
│   │   ├── jokers.js   # os 25 Coringas (dados + ganchos)
│   │   ├── planets.js  # os 9 Planetas
│   │   └── bosses.js   # os 8 Chefes
│   └── ui/
│       ├── screens.js  # troca de telas conforme o estado
│       ├── render.js   # mão, Coringas, sidebar, loja
│       ├── animate.js  # sequência animada de pontuação
│       └── tooltip.js
└── tests/
    ├── index.html      # roda asserções no navegador (verde/vermelho)
    └── *.test.js       # testes de poker, scoring, economy
```

ES Modules nativos (`<script type="module">`), zero dependências, zero build.

### Fluxo de dados

- Um único objeto `state` descreve a run inteira: seed do RNG, baralho, mão atual,
  Coringas (com estado interno, ex.: contador do Coringa Verde), consumíveis,
  níveis das mãos, dinheiro, ante, blind atual, contadores e `fase` (tela atual).
- Ações do jogador → funções do `engine/` que mutam o estado e **retornam uma lista
  de eventos** (ex.: `{tipo: "carta-pontuou", chips: 10}`) que o `ui/animate.js`
  reproduz em ordem.
- `engine/` não toca no DOM; `ui/` não calcula regras.
- Após cada ação, o estado é serializado em JSON para
  `localStorage["balatrojs-save"]`. Coringas/Chefes são salvos por `id` + estado
  interno e religados às funções de `data/` ao carregar. Save é apagado ao terminar
  a run.

### Aleatoriedade

Gerador **mulberry32** com seed própria guardada (e avançada) no estado/save —
recarregar a página não re-rola a sorte, e abre caminho para seeds compartilháveis.

### Tratamento de erros

- Save corrompido ou de versão antiga (campo `versao` no JSON): descarta e oferece
  run nova, sem quebrar a página.
- Ações inválidas (jogar com 0 cartas, comprar sem dinheiro/espaço) são bloqueadas
  na UI (botão desabilitado com motivo no tooltip) e ignoradas no engine.

## Testes

`tests/index.html` importa os módulos puros e roda asserções simples (função
`assert` própria), exibindo verde/vermelho no navegador. Cobertura mínima:

- `poker.js`: detecção das 9 mãos, incluindo casos-limite (Ás baixo na sequência
  A-2-3-4-5, Flush vs Sequência de Naipe, Full House vs Trinca).
- `scoring.js`: pipeline com 0, 1 e vários Coringas; ordem dos slots; ×mult após
  +mult; Chefes que anulam naipes.
- `economy.js`: juros, prêmios, preços de venda.

## Deploy

Repositório é o site: ativar GitHub Pages na branch `main` (root). Nenhum build.

## Milestones futuras

1. Fundo animado (canvas atrás da UI).
2. Tarô e Espectrais (+ mãos secretas).
3. Vouchers e tags ao pular blind.
4. Baralhos alternativos e stakes.
5. Layout mobile/responsivo.
6. Arquivo de strings para troca de idioma.
7. Seed compartilhável na tela de título.

# BalatroJS

Clone de estudo do núcleo jogável de [Balatro](https://www.playbalatro.com/), feito
em JavaScript, HTML e CSS puros — sem build, sem dependências. Interface em
português (BR).

**Jogue:** https://gustavoktausend.github.io/BalatroJs/

## O que tem na v1

- 8 antes com Aposta Pequena, Grande e 8 Chefes com efeitos próprios
- 9 mãos de pôquer com níveis (cartas de Planeta)
- 25 Coringas (comuns, incomuns e raros) com ordem que importa
- Loja com re-rolagem, pacotes-surpresa e venda de Coringas
- Save automático da run no navegador (localStorage)
- RNG com seed: recarregar a página não re-rola a sorte
- Sem dependências externas em runtime — fontes self-hosted (OFL) em `fonts/`

## Rodando localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Testes

```bash
node tests/todos.js          # na linha de comando (Node 18+)
# ou abra http://localhost:8000/tests/ no navegador
```

## Roadmap (milestones futuras)

Fundo animado, Tarô/Espectrais, vouchers e tags, baralhos alternativos e stakes,
layout mobile, troca de idioma e seed compartilhável. Detalhes em
`docs/superpowers/specs/2026-06-12-balatro-clone-design.md`.

*Projeto de estudo sem fins comerciais, não afiliado à LocalThunk/Playstack.
Nenhum asset do jogo original é utilizado.*

# Estado da execução do plano — BalatroJs v1

Atualizado em: 2026-06-12
Plano: `docs/superpowers/plans/2026-06-12-balatro-v1.md` (16 tarefas, código completo em cada uma)
Branch: `feature/v1` | Workflow: superpowers:subagent-driven-development
(implementador haiku por tarefa → revisor spec+qualidade sonnet → fixes se necessário)

## Concluídas (implementadas + revisadas + aprovadas)

- [x] Task 1 — harness de testes (+fixes de review: erro?.message, clear() no shim)
- [x] Task 2 — RNG mulberry32 (+fixes: teste golden, igualdade de estado final)
- [x] Task 3 — baralho
- [x] Task 4 — mãos + detecção de pôquer
- [x] Task 5 — economia
- [x] Task 6 — chefes e blinds
- [x] Task 7 — planetas + 25 coringas
- [x] Task 8 — pipeline de pontuação (+polish: suprime efeito ×1 nulo; ?? no deck)
- [x] Task 9 — estado + save localStorage
- [x] Task 10 — loja (implementada e revisada; fixes do review AINDA PENDENTES, ver abaixo)

Testes atuais: `node tests/todos.js` → **58 teste(s), 0 falha(s)**
(os totais previstos no plano valem +1 a partir da Task 3, por causa do teste golden extra do RNG)

## PRÓXIMO PASSO IMEDIATO — fixes do review da Task 10 (não aplicados)

1. `js/engine/shop.js` — primeira linha de `reordenarCoringas`:
   `if (de < 0 || de >= state.coringas.length) return;`
2. `js/state.js` — em `carregar`, trocar o .map das coringas por:
   `dados.coringas = dados.coringas.map(({ id, dados: d }) => ({ id, dados: d, def: CORINGAS[id] })).filter((c) => c.def !== undefined);`
3. `tests/shop.test.js` — remover `MAX_CORINGAS, MAX_CONSUMIVEIS,` (não usados) do import.

Depois: `node tests/todos.js` (esperado 58/0) e commit:
`fix: guarda de índices ao reordenar, filtra coringas desconhecidos no load`

## Pendentes (na ordem)

- [ ] Task 11 — orquestração da rodada (engine/run.js) — esperado 71 testes ao final (70 do plano +1)
- [ ] Task 12 — HTML + CSS
- [ ] Task 13 — UI título + seleção de blind
- [ ] Task 14 — UI rodada + animação
- [ ] Task 15 — UI loja/pacote/fim
- [ ] Task 16 — README + verificação final + deploy GitHub Pages
- [ ] Revisão final do conjunto (subagente opus) + superpowers:finishing-a-development-branch (merge em main)

## Convenções (não esquecer nos prompts dos subagentes)

- Código/comentários em português; zero dependências; ES modules sem build.
- Todo commit com segunda linha: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- O texto completo de cada task (com todo o código) está no arquivo do plano — copiar a seção "### Task N" no prompt do implementador.
- Revisor: spec primeiro, qualidade depois; aplicar fixes Important; minors viram batch de polimento.

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
- [x] Task 10 — loja (+fixes do review aplicados e commitados: guarda de índices, filter no load, import limpo)
- [x] Task 11 — orquestração da rodada (engine/run.js) — aprovada sem fixes
- [x] Task 12 — HTML + CSS (cópia canônica, aprovada sem fixes)
- [x] Task 13 — UI título + seleção de blind (cópia canônica, aprovada sem fixes)
- [x] Task 14 — UI rodada + animação (aprovada; import de run.js unificado em screens.js)
- [x] Task 15 — UI loja/pacote/fim (aprovada sem fixes)
- [x] Task 16 — README (idêntico ao plano) + smoke headless via engine em 3 seeds, sem crashes

Testes atuais: `node tests/todos.js` → **71 teste(s), 0 falha(s)**
(os totais previstos no plano valem +1 a partir da Task 3, por causa do teste golden extra do RNG)

## Pendentes (na ordem)

- [ ] Revisão final do conjunto (subagente opus) + superpowers:finishing-a-development-branch (merge em main)
- [ ] Deploy GitHub Pages (ação do usuário: criar repo no GitHub, push, Settings→Pages → main/(root); depois trocar SEU-USUARIO no README)
- [ ] Verificação visual no navegador (não há browser neste ambiente; roteiro no Step 2 da Task 16 do plano)

## Convenções (não esquecer nos prompts dos subagentes)

- Código/comentários em português; zero dependências; ES modules sem build.
- Todo commit com segunda linha: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- O texto completo de cada task (com todo o código) está no arquivo do plano — copiar a seção "### Task N" no prompt do implementador.
- Revisor: spec primeiro, qualidade depois; aplicar fixes Important; minors viram batch de polimento.

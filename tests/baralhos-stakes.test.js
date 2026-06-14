import { teste, ok, igual } from "./harness.js";
import { BARALHOS } from "../js/data/baralhos.js";
import { STAKES } from "../js/data/stakes.js";
import { criarRun } from "../js/state.js";

teste("baralhos: 4 baralhos com campos esperados; padrão neutro", () => {
  igual(Object.keys(BARALHOS).length, 4);
  for (const id of ["padrao", "vermelho", "azul", "amarelo"]) ok(BARALHOS[id], `falta ${id}`);
  const p = BARALHOS.padrao;
  igual([p.dinheiroInicial, p.maosBonus, p.descartesBonus], [0, 0, 0], "padrão neutro");
  igual(BARALHOS.vermelho.descartesBonus, 1);
  igual(BARALHOS.azul.maosBonus, 1);
  igual(BARALHOS.amarelo.dinheiroInicial, 10);
});

teste("stakes: 3 stakes; branco neutro", () => {
  igual(Object.keys(STAKES).length, 3);
  igual(STAKES.branco.multAlvo, 1);
  igual(STAKES.branco.dinheiroInicial, 0);
  igual(STAKES.vermelho.multAlvo, 1.25);
  igual(STAKES.dourado.multAlvo, 1.25);
  igual(STAKES.dourado.dinheiroInicial, -1);
});

teste("criarRun: baralho/stake default são padrao/branco e dinheiro 4", () => {
  const s = criarRun(1);
  igual(s.baralho, "padrao");
  igual(s.stake, "branco");
  igual(s.dinheiro, 4);
});

teste("criarRun: dinheiro inicial combina baralho + stake (piso 0)", () => {
  igual(criarRun(1, "amarelo", "branco").dinheiro, 14, "Amarelo +10");
  igual(criarRun(1, "padrao", "dourado").dinheiro, 3, "Dourado -1");
  igual(criarRun(1, "amarelo", "dourado").dinheiro, 13, "empilha");
});

teste("criarRun: mesma seed+baralho+stake reproduz a run", () => {
  igual(criarRun(42, "azul", "vermelho").chefesPorAnte, criarRun(42, "azul", "vermelho").chefesPorAnte);
});

import { teste, ok, igual } from "./harness.js";
import { BARALHOS } from "../js/data/baralhos.js";
import { STAKES } from "../js/data/stakes.js";
import { criarRun } from "../js/state.js";
import { alvoDaBlind } from "../js/engine/blinds.js";
import { iniciarBlind, MAOS_POR_BLIND, DESCARTES_POR_BLIND } from "../js/engine/run.js";

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

teste("alvoDaBlind: multStake default 1 = atual; 1.25 escala com floor", () => {
  igual(alvoDaBlind(1, "pequena", null), 300, "default 1");
  igual(alvoDaBlind(1, "pequena", null, 1.25), 375, "300 * 1.25");
  igual(alvoDaBlind(1, "grande", null, 1.25), Math.floor(450 * 1.25), "450 * 1.25");
});

teste("iniciarBlind: baralho Vermelho dá +1 descarte; Azul +1 mão", () => {
  const verm = criarRun(1, "vermelho", "branco"); iniciarBlind(verm, "pequena");
  igual(verm.rodada.descartesRestantes, DESCARTES_POR_BLIND + 1);
  const azul = criarRun(1, "azul", "branco"); iniciarBlind(azul, "pequena");
  igual(azul.rodada.maosRestantes, MAOS_POR_BLIND + 1);
});

teste("iniciarBlind: Azul + voucher Mãos+ empilham (+2 mãos)", () => {
  const state = criarRun(1, "azul", "branco");
  state.vouchers = ["maos-mais"];
  iniciarBlind(state, "pequena");
  igual(state.rodada.maosRestantes, MAOS_POR_BLIND + 2);
});

teste("iniciarBlind: stake Vermelho escala o alvo em +25%", () => {
  const state = criarRun(1, "padrao", "vermelho");
  iniciarBlind(state, "pequena");
  igual(state.blindAtual.alvo, Math.floor(alvoDaBlind(state.ante, "pequena", null) * 1.25));
});

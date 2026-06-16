import { teste, ok, igual } from "./harness.js";
import { criarRun, salvar, carregar, apagarSave, VERSAO_SAVE } from "../js/state.js";
import { novoCoringa } from "../js/data/jokers.js";

teste("state: criarRun monta o estado inicial do spec", () => {
  const state = criarRun(123);
  igual(state.dinheiro, 4);
  igual(state.ante, 1);
  igual(state.proximaBlind, "pequena");
  igual(state.fase, "selecao-blind");
  igual(state.coringas, []);
  igual(state.consumiveis, []);
  igual(state.vouchers, []);
  igual(state.baralho, "padrao");
  igual(state.stake, "branco");
  igual(state.chefesPorAnte.length, 8);
  igual(new Set(state.chefesPorAnte).size, 8);
  igual(Object.values(state.niveisMaos), [1, 1, 1, 1, 1, 1, 1, 1, 1]);
});

teste("state: mesma seed gera a mesma run", () => {
  igual(criarRun(42).chefesPorAnte, criarRun(42).chefesPorAnte);
});

teste("state: salvar/carregar religa os ganchos dos coringas", () => {
  apagarSave();
  const state = criarRun(7);
  state.coringas.push(novoCoringa("coringa-verde"));
  state.coringas[0].dados.mult = 3;
  salvar(state);

  const carregado = carregar();
  igual(carregado.semente, 7);
  igual(carregado.coringas[0].dados.mult, 3);
  ok(typeof carregado.coringas[0].def.ganchos.aoPontuarMao === "function", "def religado");
  apagarSave();
});

teste("state: save de versão diferente ou corrompido vira null", () => {
  apagarSave();
  igual(carregar(), null, "sem save");
  localStorage.setItem("balatrojs-save", "{isso não é json");
  igual(carregar(), null, "json inválido");
  localStorage.setItem("balatrojs-save", JSON.stringify({ versao: 999, coringas: [] }));
  igual(carregar(), null, "versão desconhecida");
  apagarSave();
});

teste("state: criarRun cria baralhoRun de 52 cartas com aprimoramento null", () => {
  const s = criarRun(123);
  ok(Array.isArray(s.baralhoRun) && s.baralhoRun.length === 52, "baralhoRun deve ter 52 cartas");
  ok(s.baralhoRun.every((c) => c.aprimoramento === null));
});

teste("state: VERSAO_SAVE é 5", () => {
  igual(VERSAO_SAVE, 5);
});

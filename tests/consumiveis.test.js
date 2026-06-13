import { teste, ok, igual } from "./harness.js";
import { criarRun } from "../js/state.js";
import { TAROS } from "../js/data/taros.js";
import { ESPECTRAIS } from "../js/data/espectrais.js";
import { novoCoringa } from "../js/data/jokers.js";

teste("taros: O Mundo dá +$20", () => {
  const state = criarRun(1);
  const antes = state.dinheiro;
  igual(TAROS["o-mundo"].aplicar(state), {});
  igual(state.dinheiro, antes + 20);
});

teste("taros: A Estrela sobe 1 nível de uma mão (determinístico)", () => {
  const state = criarRun(1);
  const total = () => Object.values(state.niveisMaos).reduce((a, b) => a + b, 0);
  const antes = total();
  igual(TAROS["a-estrela"].aplicar(state), {});
  igual(total(), antes + 1, "exatamente um nível subiu");
});

teste("taros: A Lua cria um Planeta no slot", () => {
  const state = criarRun(1);
  igual(TAROS["a-lua"].aplicar(state), {});
  igual(state.consumiveis.length, 1);
  igual(state.consumiveis[0].tipo, "planeta");
});

teste("taros: O Diabo cria um Coringa comum; sem slot dá erro", () => {
  const state = criarRun(1);
  igual(TAROS["o-diabo"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "comum");
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(TAROS["o-diabo"].aplicar(state).erro, "sem-espaco");
});

teste("taros: A Roda cria incomum ou dá +$5 (nunca falha)", () => {
  const state = criarRun(2);
  const r = TAROS["a-roda"].aplicar(state);
  igual(r, {}, "nunca retorna erro");
  ok(state.coringas.length === 1 || state.dinheiro >= 4, "criou coringa ou ganhou dinheiro");
});

teste("taros: A Temperança paga venda dos coringas (teto 20)", () => {
  const state = criarRun(1);
  state.dinheiro = 0;
  state.coringas = [];
  igual(TAROS["a-temperanca"].aplicar(state), {});
  igual(state.dinheiro, 0, "0 coringas → +0");
  state.coringas = [novoCoringa("coringa"), novoCoringa("ganancioso")];
  const antes = state.dinheiro;
  igual(TAROS["a-temperanca"].aplicar(state), {});
  ok(state.dinheiro > antes, "soma valor de venda");
  ok(state.dinheiro - antes <= 20, "teto de 20");
});

teste("espectrais: Aether sobe 2 níveis", () => {
  const state = criarRun(1);
  const total = () => Object.values(state.niveisMaos).reduce((a, b) => a + b, 0);
  const antes = total();
  igual(ESPECTRAIS["aether"].aplicar(state), {});
  igual(total(), antes + 2);
});

teste("espectrais: Séance cria Coringa raro; sem slot dá erro", () => {
  const state = criarRun(1);
  igual(ESPECTRAIS["seance"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "raro");
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(ESPECTRAIS["seance"].aplicar(state).erro, "sem-espaco");
});

teste("espectrais: Wraith cria raro e zera dinheiro; sem slot não zera", () => {
  const state = criarRun(1);
  state.dinheiro = 30;
  igual(ESPECTRAIS["wraith"].aplicar(state), {});
  igual(state.coringas.length, 1);
  igual(state.coringas[0].def.raridade, "raro");
  igual(state.dinheiro, 0, "zera ao criar");
  state.dinheiro = 30;
  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  igual(ESPECTRAIS["wraith"].aplicar(state).erro, "sem-espaco");
  igual(state.dinheiro, 30, "falha antes de zerar");
});

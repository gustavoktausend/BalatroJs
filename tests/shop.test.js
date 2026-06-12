import { teste, ok, igual } from "./harness.js";
import { criarRun } from "../js/state.js";
import { novoCoringa, CORINGAS } from "../js/data/jokers.js";
import {
  gerarLoja, comprarItem, rerolar, comprarPacote, escolherDoPacote,
  pularPacote, venderCoringa, reordenarCoringas, PRECO_PACOTE,
} from "../js/engine/shop.js";

function comLoja(semente = 1) {
  const state = criarRun(semente);
  state.dinheiro = 50;
  gerarLoja(state);
  return state;
}

teste("shop: gera 2 itens válidos", () => {
  const state = comLoja();
  igual(state.loja.itens.length, 2);
  for (const item of state.loja.itens) {
    ok(item.tipo === "coringa" || item.tipo === "planeta", `tipo inválido: ${item.tipo}`);
    ok(item.preco > 0);
  }
});

teste("shop: comprar coringa deduz dinheiro, adiciona e some da prateleira", () => {
  const state = comLoja();
  state.loja.itens[0] = { tipo: "coringa", id: "coringa", preco: 3 };
  const dinheiroAntes = state.dinheiro;
  igual(comprarItem(state, 0), {});
  igual(state.dinheiro, dinheiroAntes - 3);
  igual(state.coringas.length, 1);
  igual(state.coringas[0].id, "coringa");
  igual(state.loja.itens[0], null);
});

teste("shop: comprar planeta vai para os consumíveis", () => {
  const state = comLoja();
  state.loja.itens[0] = { tipo: "planeta", id: "mercurio", preco: 3 };
  igual(comprarItem(state, 0), {});
  igual(state.consumiveis, ["mercurio"]);
});

teste("shop: bloqueia sem dinheiro e sem espaço", () => {
  const state = comLoja();
  state.loja.itens[0] = { tipo: "coringa", id: "coringa", preco: 3 };
  state.dinheiro = 2;
  igual(comprarItem(state, 0).erro, "sem-dinheiro");

  state.dinheiro = 50;
  state.coringas = ["ganancioso", "voraz", "colerico", "guloso", "maluco"].map(novoCoringa);
  igual(comprarItem(state, 0).erro, "sem-espaco");

  state.loja.itens[1] = { tipo: "planeta", id: "venus", preco: 3 };
  state.consumiveis = ["plutao", "marte"];
  igual(comprarItem(state, 1).erro, "sem-espaco");
});

teste("shop: coringas possuídos não aparecem no sorteio", () => {
  const state = criarRun(5);
  state.dinheiro = 50;
  // possui todos menos um comum
  state.coringas = Object.values(CORINGAS)
    .filter((c) => c.id !== "coringa")
    .map((c) => novoCoringa(c.id));
  for (let i = 0; i < 20; i++) {
    gerarLoja(state);
    for (const item of state.loja.itens) {
      if (item.tipo === "coringa") igual(item.id, "coringa");
    }
  }
});

teste("shop: rerolar custa e encarece $1", () => {
  const state = comLoja();
  const dinheiroAntes = state.dinheiro;
  igual(state.loja.precoRerolar, 5);
  igual(rerolar(state), {});
  igual(state.dinheiro, dinheiroAntes - 5);
  igual(state.loja.precoRerolar, 6);
  state.dinheiro = 3;
  igual(rerolar(state).erro, "sem-dinheiro");
});

teste("shop: pacote abre opções e escolher devolve à loja", () => {
  const state = comLoja();
  const dinheiroAntes = state.dinheiro;
  igual(comprarPacote(state), {});
  igual(state.dinheiro, dinheiroAntes - PRECO_PACOTE);
  igual(state.fase, "pacote");
  ok(state.pacote.tipo === "planeta" || state.pacote.tipo === "coringa");
  const esperado = state.pacote.tipo === "planeta" ? 3 : 2;
  igual(state.pacote.opcoes.length, esperado);
  igual(new Set(state.pacote.opcoes).size, esperado, "opções únicas");

  const tipo = state.pacote.tipo;
  igual(escolherDoPacote(state, 0), {});
  igual(state.fase, "loja");
  igual(state.pacote, null);
  if (tipo === "planeta") igual(state.consumiveis.length, 1);
  else igual(state.coringas.length, 1);
  igual(comprarPacote(state).erro, "ja-aberto", "um pacote por visita");
});

teste("shop: pular pacote", () => {
  const state = comLoja(8);
  comprarPacote(state);
  pularPacote(state);
  igual(state.fase, "loja");
  igual(state.pacote, null);
});

teste("shop: vender devolve metade e holograma cresce ao comprar", () => {
  const state = comLoja();
  state.coringas = [novoCoringa("holograma")];
  igual(state.coringas[0].dados.x, 1.5);
  state.loja.itens[0] = { tipo: "coringa", id: "coringa", preco: 3 };
  comprarItem(state, 0);
  igual(state.coringas[0].dados.x, 1.75, "holograma ouviu a compra");

  const dinheiroAntes = state.dinheiro;
  igual(venderCoringa(state, 1), {}); // vende o "coringa" ($3 → $2)
  igual(state.dinheiro, dinheiroAntes + 2);
  igual(state.coringas.length, 1);
});

teste("shop: reordenar coringas", () => {
  const state = criarRun(1);
  state.coringas = ["coringa", "ganancioso", "voraz"].map(novoCoringa);
  reordenarCoringas(state, 0, 2);
  igual(state.coringas.map((c) => c.id), ["ganancioso", "voraz", "coringa"]);
});

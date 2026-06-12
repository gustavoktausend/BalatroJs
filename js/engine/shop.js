import { proximoAleatorio, escolher } from "./rng.js";
import { CORINGAS, novoCoringa } from "../data/jokers.js";
import { PLANETAS, PRECO_PLANETA } from "../data/planets.js";
import { precoVenda } from "./economy.js";

export const PRECO_PACOTE = 4;
export const MAX_CORINGAS = 5;
export const MAX_CONSUMIVEIS = 2;

function sortearRaridade(state) {
  const r = proximoAleatorio(state);
  if (r < 0.70) return "comum";
  if (r < 0.95) return "incomum";
  return "raro";
}

function coringasDisponiveis(state, raridade) {
  const possuidos = new Set(state.coringas.map((c) => c.id));
  return Object.values(CORINGAS).filter((c) => c.raridade === raridade && !possuidos.has(c.id));
}

function sortearCoringa(state) {
  let opcoes = coringasDisponiveis(state, sortearRaridade(state));
  if (!opcoes.length) opcoes = coringasDisponiveis(state, "comum");
  if (!opcoes.length) return null;
  const def = escolher(state, opcoes);
  return { tipo: "coringa", id: def.id, preco: def.preco };
}

function sortearPlaneta(state) {
  return { tipo: "planeta", id: escolher(state, Object.keys(PLANETAS)), preco: PRECO_PLANETA };
}

function sortearItem(state) {
  if (proximoAleatorio(state) < 0.3) return sortearPlaneta(state);
  return sortearCoringa(state) || sortearPlaneta(state);
}

export function gerarLoja(state) {
  state.loja = {
    itens: [sortearItem(state), sortearItem(state)],
    precoRerolar: 5,
    pacoteAberto: false,
  };
}

export function rerolar(state) {
  if (state.dinheiro < state.loja.precoRerolar) return { erro: "sem-dinheiro" };
  state.dinheiro -= state.loja.precoRerolar;
  state.loja.precoRerolar += 1;
  state.loja.itens = [sortearItem(state), sortearItem(state)];
  return {};
}

function adicionarCoringa(state, id) {
  // Avisa os coringas já possuídos ANTES de adicionar o novo,
  // para o Holograma não contar a própria compra.
  for (const coringa of state.coringas) {
    coringa.def.ganchos.aoComprarCoringa?.({ state, coringa });
  }
  state.coringas.push(novoCoringa(id));
}

export function comprarItem(state, indice) {
  const item = state.loja.itens[indice];
  if (!item) return { erro: "vazio" };
  if (state.dinheiro < item.preco) return { erro: "sem-dinheiro" };
  if (item.tipo === "coringa" && state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
  if (item.tipo === "planeta" && state.consumiveis.length >= MAX_CONSUMIVEIS) return { erro: "sem-espaco" };

  state.dinheiro -= item.preco;
  state.loja.itens[indice] = null;
  if (item.tipo === "coringa") adicionarCoringa(state, item.id);
  else state.consumiveis.push(item.id);
  return {};
}

export function comprarPacote(state) {
  if (state.loja.pacoteAberto) return { erro: "ja-aberto" };
  if (state.dinheiro < PRECO_PACOTE) return { erro: "sem-dinheiro" };
  state.dinheiro -= PRECO_PACOTE;
  state.loja.pacoteAberto = true;

  if (proximoAleatorio(state) < 0.5) {
    const opcoes = [];
    const ids = Object.keys(PLANETAS);
    while (opcoes.length < 3) {
      const id = escolher(state, ids);
      if (!opcoes.includes(id)) opcoes.push(id);
    }
    state.pacote = { tipo: "planeta", opcoes };
  } else {
    const opcoes = [];
    let tentativas = 0;
    while (opcoes.length < 2 && tentativas++ < 50) {
      const sorteado = sortearCoringa(state);
      if (!sorteado) break;
      if (!opcoes.includes(sorteado.id)) opcoes.push(sorteado.id);
    }
    state.pacote = { tipo: "coringa", opcoes };
  }
  state.fase = "pacote";
  return {};
}

export function escolherDoPacote(state, indice) {
  const id = state.pacote.opcoes[indice];
  if (state.pacote.tipo === "coringa") {
    if (state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
    adicionarCoringa(state, id);
  } else {
    if (state.consumiveis.length >= MAX_CONSUMIVEIS) return { erro: "sem-espaco" };
    state.consumiveis.push(id);
  }
  state.pacote = null;
  state.fase = "loja";
  return {};
}

export function pularPacote(state) {
  state.pacote = null;
  state.fase = "loja";
}

export function venderCoringa(state, indice) {
  const coringa = state.coringas[indice];
  if (!coringa) return { erro: "vazio" };
  state.coringas.splice(indice, 1);
  state.dinheiro += precoVenda(coringa.def.preco);
  return {};
}

export function reordenarCoringas(state, de, para) {
  const [coringa] = state.coringas.splice(de, 1);
  state.coringas.splice(para, 0, coringa);
}

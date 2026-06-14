import { proximoAleatorio, escolher } from "./rng.js";
import { CORINGAS, novoCoringa } from "../data/jokers.js";
import { PLANETAS, PRECO_PLANETA } from "../data/planets.js";
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
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

function sortearTaro(state) {
  const def = escolher(state, Object.values(TAROS));
  return { tipo: "taro", id: def.id, preco: def.preco };
}

function sortearEspectral(state) {
  const def = escolher(state, Object.values(ESPECTRAIS));
  return { tipo: "espectral", id: def.id, preco: def.preco };
}

function sortearItem(state) {
  const r = proximoAleatorio(state);
  if (r < 0.45) return sortearCoringa(state) || sortearPlaneta(state);
  if (r < 0.70) return sortearPlaneta(state);
  if (r < 0.92) return sortearTaro(state);
  return sortearEspectral(state);
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

// Cria um Coringa aleatório de uma raridade no slot, se houver espaço e opção.
// Reusado por Tarôs/Espectrais. Devolve {} ou { erro }.
export function criarCoringaDe(state, raridade) {
  if (state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
  const opcoes = coringasDisponiveis(state, raridade);
  if (!opcoes.length) return { erro: "vazio" };
  adicionarCoringa(state, escolher(state, opcoes).id);
  return {};
}

export function comprarItem(state, indice) {
  const item = state.loja.itens[indice];
  if (!item) return { erro: "vazio" };
  if (state.dinheiro < item.preco) return { erro: "sem-dinheiro" };
  if (item.tipo === "coringa" && state.coringas.length >= MAX_CORINGAS) return { erro: "sem-espaco" };
  if (item.tipo !== "coringa" && state.consumiveis.length >= MAX_CONSUMIVEIS) return { erro: "sem-espaco" };

  state.dinheiro -= item.preco;
  state.loja.itens[indice] = null;
  if (item.tipo === "coringa") adicionarCoringa(state, item.id);
  else state.consumiveis.push({ tipo: item.tipo, id: item.id });
  return {};
}

// Sorteia N ids únicos de uma lista (para opções de pacote). Para se a lista for menor.
function sortearOpcoesUnicas(state, ids, n) {
  const opcoes = [];
  let tentativas = 0;
  while (opcoes.length < Math.min(n, ids.length) && tentativas++ < 100) {
    const id = escolher(state, ids);
    if (!opcoes.includes(id)) opcoes.push(id);
  }
  return opcoes;
}

export function comprarPacote(state) {
  if (state.loja.pacoteAberto) return { erro: "ja-aberto" };
  if (state.dinheiro < PRECO_PACOTE) return { erro: "sem-dinheiro" };
  state.dinheiro -= PRECO_PACOTE;
  state.loja.pacoteAberto = true;

  const r = proximoAleatorio(state);
  if (r < 0.30) {
    state.pacote = { tipo: "planeta", opcoes: sortearOpcoesUnicas(state, Object.keys(PLANETAS), 3) };
  } else if (r < 0.60) {
    const opcoes = [];
    let tentativas = 0;
    while (opcoes.length < 2 && tentativas++ < 50) {
      const sorteado = sortearCoringa(state);
      if (!sorteado) break;
      if (!opcoes.includes(sorteado.id)) opcoes.push(sorteado.id);
    }
    state.pacote = { tipo: "coringa", opcoes };
  } else if (r < 0.90) {
    state.pacote = { tipo: "taro", opcoes: sortearOpcoesUnicas(state, Object.keys(TAROS), 3) };
  } else {
    state.pacote = { tipo: "espectral", opcoes: sortearOpcoesUnicas(state, Object.keys(ESPECTRAIS), 2) };
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
    state.consumiveis.push({ tipo: state.pacote.tipo, id });
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
  if (de < 0 || de >= state.coringas.length) return;
  const [coringa] = state.coringas.splice(de, 1);
  state.coringas.splice(para, 0, coringa);
}

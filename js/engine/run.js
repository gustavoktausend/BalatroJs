import { copiarBaralho } from "./deck.js";
import { embaralhar } from "./rng.js";
import { detectarMao } from "./poker.js";
import { pontuarJogada, chefeAtivo } from "./scoring.js";
import { alvoDaBlind, chefeDoAnte } from "./blinds.js";
import { recompensaBlind } from "./economy.js";
import { gerarLoja } from "./shop.js";
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";
import { PLANETAS } from "../data/planets.js";
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
import { apagarSave } from "../state.js";

export const MAOS_POR_BLIND = 4;
export const DESCARTES_POR_BLIND = 3;
export const TAMANHO_MAO = 8;

export function iniciarBlind(state, tipo) {
  const chefeId = tipo === "chefe" ? chefeDoAnte(state) : null;
  const baralho = BARALHOS[state.baralho] || BARALHOS.padrao;
  const multStake = (STAKES[state.stake] || STAKES.branco).multAlvo;
  state.blindAtual = { tipo, chefeId, alvo: alvoDaBlind(state.ante, tipo, chefeId, multStake) };
  state.rodada = {
    baralho: embaralhar(state, copiarBaralho(state.baralhoRun)),
    mao: [],
    pontuacao: 0,
    maosRestantes: MAOS_POR_BLIND + (state.vouchers.includes("maos-mais") ? 1 : 0) + baralho.maosBonus,
    descartesRestantes: DESCARTES_POR_BLIND + baralho.descartesBonus,
    descartesUsados: 0,
    tiposJogados: [],
    ordenacao: "valor",
  };
  state.rodada.totalCartas = state.rodada.baralho.length;
  reporMao(state);
  state.fase = "rodada";
}

export function pularBlind(state) {
  if (state.proximaBlind === "chefe") return { erro: "chefe-obrigatorio" };
  avancarBlind(state);
  return {};
}

function avancarBlind(state) {
  if (state.proximaBlind === "pequena") state.proximaBlind = "grande";
  else if (state.proximaBlind === "grande") state.proximaBlind = "chefe";
  else {
    state.proximaBlind = "pequena";
    state.ante += 1;
  }
}

function reporMao(state) {
  const rodada = state.rodada;
  while (rodada.mao.length < TAMANHO_MAO && rodada.baralho.length > 0) {
    rodada.mao.push(rodada.baralho.pop());
  }
  ordenarMao(state, rodada.ordenacao);
}

export function ordenarMao(state, modo) {
  state.rodada.ordenacao = modo;
  const porValor = (a, b) => b.valor - a.valor;
  const porNaipe = (a, b) => a.naipe.localeCompare(b.naipe) || b.valor - a.valor;
  state.rodada.mao.sort(modo === "naipe" ? porNaipe : porValor);
}

export function jogar(state, indices) {
  const rodada = state.rodada;
  if (!indices.length || indices.length > 5) return { erro: "selecao-invalida" };
  if (rodada.maosRestantes <= 0) return { erro: "sem-maos" };

  const cartas = indices.map((i) => rodada.mao[i]);
  const chefe = chefeAtivo(state);
  if (chefe?.ganchos.jogadaValida && !chefe.ganchos.jogadaValida(cartas, state)) {
    return { erro: "bloqueada-pelo-chefe" };
  }

  // Conta antes de pontuar para a Supernova incluir a jogada atual;
  // tiposJogados só recebe o tipo depois, para Trapaceiro/Boca verem o passado.
  const tipo = detectarMao(cartas).tipo;
  state.estatisticas.porMao[tipo] = (state.estatisticas.porMao[tipo] || 0) + 1;
  const { total, eventos } = pontuarJogada(state, cartas);

  rodada.pontuacao += total;
  rodada.maosRestantes -= 1;
  rodada.tiposJogados.push(tipo);
  state.ultimaMaoJogada = tipo;
  state.estatisticas.melhorJogada = Math.max(state.estatisticas.melhorJogada, total);
  const selecionadas = new Set(indices);
  rodada.mao = rodada.mao.filter((_, i) => !selecionadas.has(i));
  chefe?.ganchos.aposJogar?.(state);

  if (rodada.pontuacao >= state.blindAtual.alvo) {
    return { eventos, vitoriaBlind: true, ...vencerBlind(state, eventos) };
  }
  if (rodada.maosRestantes === 0) {
    state.vitoria = false;
    state.fase = "fim";
    apagarSave();
    return { eventos, derrota: true };
  }
  reporMao(state);
  return { eventos };
}

function vencerBlind(state, eventos) {
  const tipo = state.blindAtual.tipo;

  let dinheiroExtra = 0;
  const destruidos = [];
  for (const coringa of state.coringas) {
    const efeito = coringa.def.ganchos.aoFimDaRodada?.({ state, coringa, blindTipo: tipo });
    if (efeito?.dinheiro) dinheiroExtra += efeito.dinheiro;
    if (efeito?.destruir) destruidos.push(coringa);
  }
  for (const coringa of destruidos) {
    state.coringas.splice(state.coringas.indexOf(coringa), 1);
    eventos.push({ tipo: "coringa-destruido", id: coringa.id, nome: coringa.def.nome });
  }

  const tetoJuros = state.vouchers.includes("juros-mais") ? 10 : 5;
  const recompensa = recompensaBlind(tipo, state.rodada.maosRestantes, state.dinheiro, tetoJuros) + dinheiroExtra;
  state.dinheiro += recompensa;
  state.estatisticas.rodadas += 1;

  if (tipo === "chefe" && state.ante === 8) {
    state.vitoria = true;
    state.fase = "fim";
    apagarSave();
    return { recompensa };
  }
  avancarBlind(state);
  gerarLoja(state);
  state.fase = "loja";
  return { recompensa };
}

export function descartar(state, indices) {
  const rodada = state.rodada;
  if (!indices.length || indices.length > 5) return { erro: "selecao-invalida" };
  if (rodada.descartesRestantes <= 0) return { erro: "sem-descartes" };

  const selecionadas = new Set(indices);
  rodada.mao = rodada.mao.filter((_, i) => !selecionadas.has(i));
  rodada.descartesRestantes -= 1;
  rodada.descartesUsados += 1;
  for (const coringa of state.coringas) {
    coringa.def.ganchos.aoDescartar?.({ state, coringa });
  }
  reporMao(state);
  return {};
}

export function usarConsumivel(state, indice) {
  const item = state.consumiveis[indice];
  if (!item) return { erro: "slot-vazio" };

  if (item.tipo === "planeta") {
    state.consumiveis.splice(indice, 1);
    state.niveisMaos[PLANETAS[item.id].mao] += 1;
    for (const coringa of state.coringas) {
      coringa.def.ganchos.aoUsarPlaneta?.({ state, coringa });
    }
    return {};
  }

  // Tarô/Espectral: remove o slot antes de aplicar (libera vaga p/ A Lua);
  // se aplicar falhar, reinsere o consumível na posição original.
  const def = item.tipo === "taro" ? TAROS[item.id] : ESPECTRAIS[item.id];
  state.consumiveis.splice(indice, 1);
  const resultado = def.aplicar(state);
  if (resultado.erro) {
    state.consumiveis.splice(indice, 0, item);
    return resultado;
  }
  return {};
}

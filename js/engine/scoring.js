import { detectarMao } from "./poker.js";
import { MAOS, valoresDaMao } from "../data/hands.js";
import { chipsDaCarta } from "./deck.js";
import { CHEFES } from "../data/bosses.js";

export function chefeAtivo(state) {
  const blind = state.blindAtual;
  return blind && blind.tipo === "chefe" ? CHEFES[blind.chefeId] : null;
}

// Pontua uma jogada e devolve { total, eventos, jogada }.
// Os eventos saem na ordem exata em que a UI deve animá-los.
export function pontuarJogada(state, cartas) {
  const jogada = detectarMao(cartas);
  jogada.cartas = cartas;
  const chefe = chefeAtivo(state);

  let { chips, mult } = valoresDaMao(jogada.tipo, state.niveisMaos[jogada.tipo]);
  const eventos = [{ tipo: "mao", mao: jogada.tipo, nome: MAOS[jogada.tipo].nome, chips, mult }];
  const ctx = { state, jogada, memoria: {} };

  const aplicar = (efeito, origem) => {
    if (!efeito) return;
    if (!efeito.chips && !efeito.mult && (!efeito.xmult || efeito.xmult === 1)) return;
    if (efeito.chips) chips += efeito.chips;
    if (efeito.mult) mult += efeito.mult;
    if (efeito.xmult && efeito.xmult !== 1) mult = +(mult * efeito.xmult).toFixed(2);
    eventos.push({ tipo: "efeito", origem, ...efeito, chipsTotal: chips, multTotal: mult });
  };

  for (const carta of jogada.cartasQuePontuam) {
    if (chefe?.ganchos.cartaDebuffada?.(carta)) {
      eventos.push({ tipo: "carta-debuffada", carta });
      continue;
    }
    chips += chipsDaCarta(carta);
    eventos.push({ tipo: "carta", carta, chips: chipsDaCarta(carta), chipsTotal: chips });
    for (const coringa of state.coringas) {
      aplicar(coringa.def.ganchos.aoPontuarCarta?.(carta, { ...ctx, coringa }), coringa.id);
    }
  }

  for (const coringa of state.coringas) {
    aplicar(coringa.def.ganchos.aoPontuarMao?.({ ...ctx, coringa }), coringa.id);
  }

  const total = Math.floor(chips * mult);
  eventos.push({ tipo: "total", total, chips, mult });
  return { total, eventos, jogada };
}

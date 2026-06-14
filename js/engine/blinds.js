import { CHEFES } from "../data/bosses.js";
import { embaralhar } from "./rng.js";

export const BASES = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];

export function alvoDaBlind(ante, tipo, chefeId, multStake = 1) {
  const base = BASES[ante - 1];
  let alvo;
  if (tipo === "pequena") alvo = base;
  else if (tipo === "grande") alvo = base * 1.5;
  else alvo = base * (CHEFES[chefeId].multAlvo || 2);
  return Math.floor(alvo * multStake);
}

export function sortearChefes(state) {
  return embaralhar(state, Object.keys(CHEFES));
}

export function chefeDoAnte(state) {
  return state.chefesPorAnte[state.ante - 1];
}

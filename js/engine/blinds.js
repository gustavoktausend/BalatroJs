import { CHEFES } from "../data/bosses.js";
import { embaralhar } from "./rng.js";

export const BASES = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];

export function alvoDaBlind(ante, tipo, chefeId) {
  const base = BASES[ante - 1];
  if (tipo === "pequena") return base;
  if (tipo === "grande") return Math.floor(base * 1.5);
  return base * (CHEFES[chefeId].multAlvo || 2);
}

export function sortearChefes(state) {
  return embaralhar(state, Object.keys(CHEFES));
}

export function chefeDoAnte(state) {
  return state.chefesPorAnte[state.ante - 1];
}

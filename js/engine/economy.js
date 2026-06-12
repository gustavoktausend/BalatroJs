export const PREMIOS = { pequena: 3, grande: 4, chefe: 5 };

// +$1 a cada $5 guardados, máximo $5 (a partir de $25).
export function juros(dinheiro) {
  return Math.min(5, Math.floor(dinheiro / 5));
}

export function recompensaBlind(tipo, maosRestantes, dinheiro) {
  return PREMIOS[tipo] + maosRestantes + juros(dinheiro);
}

export function precoVenda(preco) {
  return Math.ceil(preco / 2);
}

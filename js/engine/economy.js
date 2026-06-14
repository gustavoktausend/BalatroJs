export const PREMIOS = { pequena: 3, grande: 4, chefe: 5 };

// +$1 a cada $5 guardados, máximo $5 (a partir de $25).
export function juros(dinheiro, teto = 5) {
  return Math.min(teto, Math.floor(dinheiro / 5));
}

export function recompensaBlind(tipo, maosRestantes, dinheiro, tetoJuros = 5) {
  return PREMIOS[tipo] + maosRestantes + juros(dinheiro, tetoJuros);
}

export function precoVenda(preco) {
  return Math.ceil(preco / 2);
}

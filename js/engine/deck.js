export const NAIPES = ["copas", "ouros", "espadas", "paus"];
export const NAIPES_VERMELHOS = ["copas", "ouros"];
export const SIMBOLO_NAIPE = { copas: "♥", ouros: "♦", espadas: "♠", paus: "♣" };
export const NOME_NAIPE = { copas: "Copas", ouros: "Ouros", espadas: "Espadas", paus: "Paus" };

// Valores: 2..10 numéricos, 11 = J, 12 = Q, 13 = K, 14 = A.
export function criarBaralho() {
  const baralho = [];
  for (const naipe of NAIPES) {
    for (let valor = 2; valor <= 14; valor++) {
      baralho.push({ id: `${naipe}-${valor}`, naipe, valor, aprimoramento: null });
    }
  }
  return baralho;
}

export function chipsDaCarta(carta) {
  if (carta.valor === 14) return 11;
  if (carta.valor > 10) return 10;
  return carta.valor;
}

const ROTULOS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

export function rotuloDaCarta(carta) {
  return ROTULOS[carta.valor] ?? String(carta.valor);
}

export function ehFigura(carta) {
  return carta.valor >= 11 && carta.valor <= 13;
}

// Cópia rasa por carta — usada para tirar o baralho da rodada do baralho-mestre
// da run sem que mutações da rodada (ex.: ordenação) vazem para o mestre.
export function copiarBaralho(baralho) {
  return baralho.map((c) => ({ ...c }));
}

export function ehPedra(carta) {
  return carta.aprimoramento === "pedra";
}

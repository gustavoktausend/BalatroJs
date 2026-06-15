// Chips e mult base (nível 1) e crescimento por nível — tabela do spec.
export const MAOS = {
  "carta-alta":         { nome: "Carta Alta",         chips: 5,   mult: 1, chipsPorNivel: 10, multPorNivel: 1, planeta: "plutao" },
  "par":                { nome: "Par",                chips: 10,  mult: 2, chipsPorNivel: 15, multPorNivel: 1, planeta: "mercurio" },
  "dois-pares":         { nome: "Dois Pares",         chips: 20,  mult: 2, chipsPorNivel: 20, multPorNivel: 1, planeta: "urano" },
  "trinca":             { nome: "Trinca",             chips: 30,  mult: 3, chipsPorNivel: 20, multPorNivel: 2, planeta: "venus" },
  "sequencia":          { nome: "Sequência",          chips: 30,  mult: 4, chipsPorNivel: 30, multPorNivel: 3, planeta: "saturno" },
  "flush":              { nome: "Naipe (Flush)",      chips: 35,  mult: 4, chipsPorNivel: 15, multPorNivel: 2, planeta: "jupiter" },
  "full-house":         { nome: "Full House",         chips: 40,  mult: 4, chipsPorNivel: 25, multPorNivel: 2, planeta: "terra" },
  "quadra":             { nome: "Quadra",             chips: 60,  mult: 7, chipsPorNivel: 30, multPorNivel: 3, planeta: "marte" },
  "sequencia-de-naipe": { nome: "Sequência de Naipe", chips: 100, mult: 8, chipsPorNivel: 40, multPorNivel: 4, planeta: "netuno" },
};

export function valoresDaMao(tipo, nivel) {
  const mao = MAOS[tipo];
  return {
    chips: mao.chips + (nivel - 1) * mao.chipsPorNivel,
    mult: mao.mult + (nivel - 1) * mao.multPorNivel,
  };
}

// Para Coringas condicionais ("se a mão contém um Par"...).
const CONTEM = {
  "par":        ["par", "dois-pares", "trinca", "full-house", "quadra"],
  "dois-pares": ["dois-pares", "full-house"],
  "trinca":     ["trinca", "full-house", "quadra"],
  "sequencia":  ["sequencia", "sequencia-de-naipe"],
  // "flush" ausente de propósito: cai no fallback [alvo] (só Flush exato), sem herdar
  // sequencia-de-naipe — coringas de flush não disparam em sequência de naipe.
};

export function maoContem(tipoJogado, alvo) {
  return (CONTEM[alvo] || [alvo]).includes(tipoJogado);
}

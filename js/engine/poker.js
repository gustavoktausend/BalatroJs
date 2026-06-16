import { ehPedra } from "./deck.js";

// Detecta a melhor mão de pôquer entre 1 a 5 cartas selecionadas.
// Pedras (aprimoramento "pedra") ficam fora da detecção por rank/naipe, mas
// SEMPRE pontuam: são anexadas a cartasQuePontuam ao final.
export function detectarMao(cartas) {
  const pedras = cartas.filter(ehPedra);
  const jogaveis = cartas.filter((c) => !ehPedra(c));
  const mao = detectarEntreJogaveis(jogaveis);
  return { ...mao, cartasQuePontuam: [...mao.cartasQuePontuam, ...pedras] };
}

// Retorna { tipo, cartasQuePontuam, real } — "real" só interessa na sequência de naipe.
function detectarEntreJogaveis(cartas) {
  if (cartas.length === 0) {
    return { tipo: "carta-alta", real: false, cartasQuePontuam: [] };
  }
  const contagem = new Map();
  for (const c of cartas) contagem.set(c.valor, (contagem.get(c.valor) || 0) + 1);
  const grupos = [...contagem.entries()]
    .map(([valor, qtd]) => ({ valor, qtd }))
    .sort((a, b) => b.qtd - a.qtd || b.valor - a.valor);

  const flush = cartas.length === 5 && ehFlush(cartas);
  const sequencia = ehSequencia(cartas);
  const dosGrupos = (n) => {
    const valores = new Set(grupos.slice(0, n).map((g) => g.valor));
    return cartas.filter((c) => valores.has(c.valor));
  };

  if (flush && sequencia) {
    return { tipo: "sequencia-de-naipe", real: cartas.every((c) => c.valor >= 10), cartasQuePontuam: [...cartas] };
  }
  if (grupos[0].qtd === 4) return { tipo: "quadra", real: false, cartasQuePontuam: dosGrupos(1) };
  if (grupos[0].qtd === 3 && grupos[1]?.qtd === 2) return { tipo: "full-house", real: false, cartasQuePontuam: [...cartas] };
  if (flush) return { tipo: "flush", real: false, cartasQuePontuam: [...cartas] };
  if (sequencia) return { tipo: "sequencia", real: false, cartasQuePontuam: [...cartas] };
  if (grupos[0].qtd === 3) return { tipo: "trinca", real: false, cartasQuePontuam: dosGrupos(1) };
  if (grupos[0].qtd === 2 && grupos[1]?.qtd === 2) return { tipo: "dois-pares", real: false, cartasQuePontuam: dosGrupos(2) };
  if (grupos[0].qtd === 2) return { tipo: "par", real: false, cartasQuePontuam: dosGrupos(1) };

  const maisAlta = [...cartas].sort((a, b) => b.valor - a.valor)[0];
  return { tipo: "carta-alta", real: false, cartasQuePontuam: [maisAlta] };
}

// Flush considerando wild como naipe coringa: existe um naipe tal que toda carta
// é desse naipe OU é wild. Wild NÃO altera rank (grupos/sequência por valor).
function ehFlush(cartas) {
  const ehWild = (c) => c.aprimoramento === "wild";
  const naipesReais = cartas.filter((c) => !ehWild(c)).map((c) => c.naipe);
  if (naipesReais.length === 0) return true; // 5 wilds → flush de qualquer naipe
  const alvo = naipesReais[0];
  return cartas.every((c) => ehWild(c) || c.naipe === alvo);
}

function ehSequencia(cartas) {
  if (cartas.length !== 5) return false;
  const valores = [...new Set(cartas.map((c) => c.valor))].sort((a, b) => a - b);
  if (valores.length !== 5) return false;
  if (valores[4] - valores[0] === 4) return true;
  return valores.join(",") === "2,3,4,5,14"; // A-2-3-4-5 (ás baixo)
}

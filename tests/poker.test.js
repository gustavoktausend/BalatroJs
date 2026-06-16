import { teste, ok, igual } from "./harness.js";
import { MAOS, valoresDaMao, maoContem } from "../js/data/hands.js";
import { detectarMao } from "../js/engine/poker.js";

const carta = (naipe, valor) => ({ id: `${naipe}-${valor}`, naipe, valor });
const pedra = (naipe, valor) => ({ id: `p-${naipe}-${valor}-${Math.random()}`, naipe, valor, aprimoramento: "pedra" });

teste("hands: tabela tem as 9 mãos com valores do spec", () => {
  igual(Object.keys(MAOS).length, 9);
  igual(valoresDaMao("carta-alta", 1), { chips: 5, mult: 1 });
  igual(valoresDaMao("par", 1), { chips: 10, mult: 2 });
  igual(valoresDaMao("sequencia-de-naipe", 1), { chips: 100, mult: 8 });
  // Subida de nível: base + (nivel-1) * porNivel
  igual(valoresDaMao("par", 3), { chips: 40, mult: 4 });
  igual(valoresDaMao("quadra", 2), { chips: 90, mult: 10 });
});

teste("hands: maoContem (par dentro de full house etc.)", () => {
  ok(maoContem("full-house", "par"));
  ok(maoContem("full-house", "trinca"));
  ok(maoContem("quadra", "trinca"));
  ok(maoContem("dois-pares", "par"));
  ok(maoContem("sequencia-de-naipe", "sequencia"));
  ok(!maoContem("par", "trinca"));
  ok(!maoContem("sequencia", "par"));
});

teste("poker: carta alta — pontua só a mais alta", () => {
  const r = detectarMao([carta("copas", 2), carta("ouros", 7), carta("paus", 13)]);
  igual(r.tipo, "carta-alta");
  igual(r.cartasQuePontuam.length, 1);
  igual(r.cartasQuePontuam[0].valor, 13);
});

teste("poker: par com apenas 2 cartas selecionadas", () => {
  const r = detectarMao([carta("copas", 9), carta("ouros", 9)]);
  igual(r.tipo, "par");
  igual(r.cartasQuePontuam.length, 2);
});

teste("poker: dois pares pontuam as 4 cartas", () => {
  const r = detectarMao([
    carta("copas", 9), carta("ouros", 9),
    carta("paus", 4), carta("espadas", 4),
    carta("copas", 13),
  ]);
  igual(r.tipo, "dois-pares");
  igual(r.cartasQuePontuam.length, 4);
  ok(!r.cartasQuePontuam.some((c) => c.valor === 13), "o K não pontua");
});

teste("poker: trinca", () => {
  const r = detectarMao([
    carta("copas", 5), carta("ouros", 5), carta("paus", 5),
    carta("copas", 2), carta("ouros", 9),
  ]);
  igual(r.tipo, "trinca");
  igual(r.cartasQuePontuam.length, 3);
});

teste("poker: sequência (e exige 5 cartas)", () => {
  const r = detectarMao([
    carta("copas", 5), carta("ouros", 6), carta("paus", 7),
    carta("espadas", 8), carta("copas", 9),
  ]);
  igual(r.tipo, "sequencia");
  igual(r.cartasQuePontuam.length, 5);
  const parcial = detectarMao([carta("copas", 5), carta("ouros", 6), carta("paus", 7), carta("espadas", 8)]);
  igual(parcial.tipo, "carta-alta", "4 cartas seguidas não são sequência");
});

teste("poker: sequência com ás baixo (A-2-3-4-5)", () => {
  const r = detectarMao([
    carta("copas", 14), carta("ouros", 2), carta("paus", 3),
    carta("espadas", 4), carta("copas", 5),
  ]);
  igual(r.tipo, "sequencia");
});

teste("poker: flush", () => {
  const r = detectarMao([
    carta("copas", 2), carta("copas", 5), carta("copas", 8),
    carta("copas", 11), carta("copas", 13),
  ]);
  igual(r.tipo, "flush");
  igual(r.cartasQuePontuam.length, 5);
});

teste("poker: full house vence flush e trinca", () => {
  const r = detectarMao([
    carta("copas", 5), carta("ouros", 5), carta("paus", 5),
    carta("copas", 9), carta("ouros", 9),
  ]);
  igual(r.tipo, "full-house");
  igual(r.cartasQuePontuam.length, 5);
});

teste("poker: quadra", () => {
  const r = detectarMao([
    carta("copas", 5), carta("ouros", 5), carta("paus", 5),
    carta("espadas", 5), carta("ouros", 9),
  ]);
  igual(r.tipo, "quadra");
  igual(r.cartasQuePontuam.length, 4);
});

teste("poker: sequência de naipe e bandeira 'real'", () => {
  const comum = detectarMao([
    carta("paus", 5), carta("paus", 6), carta("paus", 7),
    carta("paus", 8), carta("paus", 9),
  ]);
  igual(comum.tipo, "sequencia-de-naipe");
  igual(comum.real, false);
  const real = detectarMao([
    carta("paus", 10), carta("paus", 11), carta("paus", 12),
    carta("paus", 13), carta("paus", 14),
  ]);
  igual(real.tipo, "sequencia-de-naipe");
  igual(real.real, true);
});

teste("poker: pedra não entra na detecção por rank, mas pontua", () => {
  const m = detectarMao([carta("copas", 9), carta("ouros", 9), pedra("paus", 2)]);
  igual(m.tipo, "par");
  ok(m.cartasQuePontuam.some((c) => c.aprimoramento === "pedra"), "pedra deve pontuar");
  ok(m.cartasQuePontuam.filter((c) => c.aprimoramento !== "pedra").length === 2, "os dois 9 pontuam");
});

teste("poker: pedra não conta como naipe no flush", () => {
  const m = detectarMao([
    carta("copas", 2), carta("copas", 5), carta("copas", 7), carta("copas", 9),
    pedra("paus", 11),
  ]);
  ok(m.tipo !== "flush", `não deveria ser flush, veio ${m.tipo}`);
});

teste("poker: jogada só de pedras é carta-alta e todas pontuam", () => {
  const m = detectarMao([pedra("copas", 2), pedra("ouros", 3)]);
  igual(m.tipo, "carta-alta");
  igual(m.cartasQuePontuam.length, 2, "as duas pedras pontuam");
});
